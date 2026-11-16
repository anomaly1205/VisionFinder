"""Embed each product's main image and save a FAISS inner-product index.

Usage: python build_index.py [--limit N] [--batch 32] [--views N]
--views 2 also indexes the first extra camera angle (one row per image, same product id). Off by default:
compare_views.py measured Top-1 57.3% -> 42.9%, because ABO's extra angles are often room scenes.
"""
import argparse
import json
import os
import time

import faiss
import numpy as np

from config import DATA_DIR, IDS_PATH, INDEX_PATH, PRODUCTS_JSON, image_path
from embedder import Embedder


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, help="only the first N products (quick test)")
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--views", type=int, default=1, help="images per product to index: main + N-1 angles")
    args = ap.parse_args()

    with open(PRODUCTS_JSON, encoding="utf-8") as f:
        products = json.load(f)[: args.limit]

    t0 = time.perf_counter()
    emb = Embedder()
    t1 = time.perf_counter()
    print(f"model loaded in {t1 - t0:.1f}s")

    rows = [(p["id"], img) for p in products for img in [p["image"], *p["gallery"][1:args.views]]]
    vecs = []
    for i in range(0, len(rows), args.batch):
        chunk = rows[i:i + args.batch]
        vecs.append(emb.embed_images([image_path(img) for _, img in chunk], batch=args.batch))
        print(f"  {i + len(chunk)}/{len(rows)}", end="\r", flush=True)
    vecs = np.concatenate(vecs)
    t2 = time.perf_counter()

    index = faiss.IndexFlatIP(vecs.shape[1])  # vectors are L2-normalised, so inner product = cosine
    index.add(vecs)
    os.makedirs(DATA_DIR, exist_ok=True)
    faiss.write_index(index, INDEX_PATH)
    with open(IDS_PATH, "w", encoding="utf-8") as f:
        json.dump([pid for pid, _ in rows], f)
    print(f"\nembedded {len(rows)} images ({len(products)} products) in {t2 - t1:.1f}s "
          f"({(t2 - t1) / len(rows) * 1000:.0f} ms/img), dim {vecs.shape[1]}")
    print(f"saved {INDEX_PATH}")


if __name__ == "__main__":
    main()
