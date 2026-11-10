"""Search logic shared by app.py and evaluate.py. Results are lists of {"id", "score"}."""
import json

import faiss
import numpy as np

from config import IDS_PATH, INDEX_PATH
from embedder import Embedder

RERANK_POOL = 50   # image search + text: rerank this many image hits
TEXT_WEIGHT = 0.5  # combined = image score + TEXT_WEIGHT * text score

# CLIP text-to-image cosine sits roughly in 0.15-0.35 (image-to-image is ~0.5-1.0).
# For display only, text scores are mapped linearly from [TEXT_LO, TEXT_HI] to [0, 1] and clipped.
# They are not comparable to THRESHOLD, so text search never applies it.
TEXT_LO, TEXT_HI = 0.15, 0.35


class SearchEngine:
    def __init__(self, embedder=None):
        self.emb = embedder or Embedder()
        self.index = faiss.read_index(INDEX_PATH)
        with open(IDS_PATH, encoding="utf-8") as f:
            self.ids = json.load(f)
        self.pos = {pid: i for i, pid in enumerate(self.ids)}

    def _search(self, vec, k):
        D, I = self.index.search(vec.reshape(1, -1), min(k, self.index.ntotal))
        return D[0], I[0]

    def search_image(self, image, text=None, k=12):
        """Score returned is always the image score, so THRESHOLD keeps its meaning."""
        q = self.emb.embed_images([image])[0]
        if not text:
            D, I = self._search(q, k)
            return [{"id": self.ids[i], "score": float(d)} for d, i in zip(D, I)]
        D, I = self._search(q, RERANK_POOL)
        t = self.emb.embed_texts([text])[0]
        text_scores = np.array([self.index.reconstruct(int(i)) @ t for i in I])
        order = np.argsort(-(D + TEXT_WEIGHT * text_scores))[:k]
        return [{"id": self.ids[I[j]], "score": float(D[j])} for j in order]

    def search_text(self, q, k=12):
        D, I = self._search(self.emb.embed_texts([q])[0], k)
        scaled = np.clip((D - TEXT_LO) / (TEXT_HI - TEXT_LO), 0, 1)
        return [{"id": self.ids[i], "score": round(float(s), 4)} for s, i in zip(scaled, I)]

    def similar(self, pid, k=12):
        """Raises KeyError for an unknown id."""
        i = self.pos[pid]
        D, I = self._search(self.index.reconstruct(i), k + 1)
        return [{"id": self.ids[j], "score": float(d)} for d, j in zip(D, I) if j != i][:k]
