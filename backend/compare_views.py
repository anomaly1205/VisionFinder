"""Fair test of multi-view indexing: does indexing a second camera angle help?

Both setups are queried with the same images: each product's LAST angle (gallery[2]), never indexed.
  A: main image only (current default)
  B: main image + angle 1 (gallery[1])
Only the 499 products with 3 images take part. Usage: python compare_views.py
"""
import json

import faiss
import numpy as np

from config import PRODUCTS_JSON, image_path
from embedder import Embedder
from search_engine import SearchEngine


def score(eng, queries, truth):
    top1 = top5 = 0
    for q, pid in zip(queries, truth):
        _, I = eng._search(q, 5)
        hits = [eng.ids[i] for i in I]
        top1 += hits[0] == pid
        top5 += pid in hits
    return top1 / len(truth), top5 / len(truth)


def main():
    with open(PRODUCTS_JSON, encoding="utf-8") as f:
        products = [p for p in json.load(f) if len(p["gallery"]) >= 3]
    emb = Embedder()
    embed = lambda paths: emb.embed_images([image_path(x) for x in paths])
    main_v = embed([p["image"] for p in products])
    ang1_v = embed([p["gallery"][1] for p in products])
    query_v = embed([p["gallery"][2] for p in products])
    ids = [p["id"] for p in products]

    res = {}
    for name, vecs, row_ids in [("A main only", main_v, ids),
                                ("B main + angle 1", np.concatenate([main_v, ang1_v]), ids + ids)]:
        index = faiss.IndexFlatIP(vecs.shape[1])
        index.add(vecs)
        res[name] = score(SearchEngine(emb, index, row_ids), query_v, ids)

    print(f"{len(ids)} queries (angle 2)\n\n| Index | Top-1 | Top-5 |\n|---|---|---|")
    for name, (t1, t5) in res.items():
        print(f"| {name} | {t1 * 100:.1f}% | {t5 * 100:.1f}% |")
    (a1, _), (b1, _) = res.values()
    print(f"\nTop-1 gain: {(b1 - a1) * 100:+.1f} points")


if __name__ == "__main__":
    main()
