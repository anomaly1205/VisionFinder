"""Search logic shared by app.py and evaluate.py. Results are lists of {"id", "score"}.

The index may hold several images per product (build_index.py --views). A product's score is its best
image's score, and each product appears once in the results.
"""
import json
import threading
from collections import Counter
from functools import lru_cache

import faiss
import numpy as np

from config import IDS_PATH, INDEX_PATH
from embedder import Embedder

RERANK_POOL = 50   # image search + text: rerank this many image hits
TEXT_WEIGHT = 0.5  # combined = image score + TEXT_WEIGHT * text score

# CLIP text-to-image cosine sits roughly in 0.15-0.35 (image-to-image is ~0.5-1.0).
# For display only, text scores are mapped linearly from [TEXT_LO, TEXT_HI] to [0, 1] and clipped.
# They are not comparable to the image thresholds, so text search never applies them.
TEXT_LO, TEXT_HI = 0.15, 0.35
# Text search wraps the query in a prompt: CLIP matches captions, so "something to read under at night"
# finds lamps only once it reads like a caption (8 test queries: 63 vs 59 relevant hits in the top 12).
TEXT_PROMPT = "a product photo of a household item for {}"


def scale_text(scores):
    return np.clip((scores - TEXT_LO) / (TEXT_HI - TEXT_LO), 0, 1)


class SearchEngine:
    def __init__(self, embedder=None, index=None, ids=None):
        """index/ids default to the files from build_index.py; compare_views.py passes in-memory ones."""
        self.emb = embedder or Embedder()
        if index is None:
            index = faiss.read_index(INDEX_PATH)
            with open(IDS_PATH, encoding="utf-8") as f:
                ids = json.load(f)
        self.index, self.ids = index, list(ids)
        self.pos = {}
        for i, pid in enumerate(self.ids):
            self.pos.setdefault(pid, i)  # first row = main image
        self.views = max(Counter(self.ids).values())  # most images any product has in the index
        self.lock = threading.Lock()  # FAISS add() must not run during a search
        # No lock around the model: measured with 8 parallel uploads, serialising made the slowest request
        # 534 -> 885 ms (mean unchanged). One image does not fill every core, so overlapping calls win.

    @lru_cache(maxsize=256)
    def _embed_text(self, text):
        v = self.emb.embed_texts([text])[0]
        v.setflags(write=False)  # cached and shared between requests
        return v

    @property
    def products(self):
        return len(self.pos)

    def _search(self, vec, k, exclude=None):
        """Top-k products: rows sorted by score, keeping each product's best row only."""
        with self.lock:
            D, I = self.index.search(vec.reshape(1, -1), min(k * self.views + 1, self.index.ntotal))
        seen, d_out, i_out = {exclude}, [], []
        for d, i in zip(D[0], I[0]):
            if i < 0 or self.ids[i] in seen:
                continue
            seen.add(self.ids[i])
            d_out.append(d)
            i_out.append(i)
            if len(i_out) == k:
                break
        return np.array(d_out, dtype="float32"), np.array(i_out, dtype="int64")

    def add(self, pid, image):
        """Embed one image and make it searchable at once. Returns the vector."""
        v = self.emb.embed_images([image])
        with self.lock:
            self.index.add(v)
            self.ids.append(pid)
            self.pos.setdefault(pid, len(self.ids) - 1)
        return v[0]

    def search_image(self, image, text=None, k=12):
        """Score returned is always the image score, so the thresholds keep their meaning."""
        q = self.emb.embed_images([image])[0]
        if not text:
            D, I = self._search(q, k)
            return [{"id": self.ids[i], "score": float(d)} for d, i in zip(D, I)]
        D, I = self._search(q, RERANK_POOL)
        t = self._embed_text(text)
        # Scale first: raw text cosine spans only ~0.2, too small to reorder image scores.
        text_scores = scale_text(np.array([self.index.reconstruct(int(i)) @ t for i in I]))
        order = np.argsort(-(D + TEXT_WEIGHT * text_scores))[:k]
        return [{"id": self.ids[I[j]], "score": float(D[j])} for j in order]

    def search_text(self, q, k=12):
        D, I = self._search(self._embed_text(TEXT_PROMPT.format(q)), k)
        return [{"id": self.ids[i], "score": round(float(s), 4)} for s, i in zip(scale_text(D), I)]

    def similar(self, pid, k=12):
        """Raises KeyError for an unknown id."""
        i = self.pos[pid]
        D, I = self._search(self.index.reconstruct(i), k, exclude=pid)
        return [{"id": self.ids[j], "score": float(d)} for d, j in zip(D, I)]
