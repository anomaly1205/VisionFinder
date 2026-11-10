"""Embed each product's main image and save a FAISS inner-product index.

Usage: python build_index.py [--limit N] [--batch 32]
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
    args = ap.parse_args()

    with open(PRODUCTS_JSON, encoding="utf-8") as f:
        products = json.load(f)[: args.limit]

    t0 = time.perf_counter()
    emb = Embedder()
    t1 = time.perf_counter()
    print(f"model loaded in {t1 - t0:.1f}s")

    vecs = []
    for i in range(0, len(products), args.batch):
        chunk = products[i:i + args.batch]
        vecs.append(emb.embed_images([image_path(p["image"]) for p in chunk], batch=args.batch))
        print(f"  {i + len(chunk)}/{len(products)}", end="\r", flush=True)
    vecs = np.concatenate(vecs)
    t2 = time.perf_counter()

    index = faiss.IndexFlatIP(vecs.shape[1])  # vectors are L2-normalised, so inner product = cosine
    index.add(vecs)
    os.makedirs(DATA_DIR, exist_ok=True)
    faiss.write_index(index, INDEX_PATH)
    with open(IDS_PATH, "w", encoding="utf-8") as f:
        json.dump([p["id"] for p in products], f)
    print(f"\nembedded {len(products)} images in {t2 - t1:.1f}s "
          f"({(t2 - t1) / len(products) * 1000:.0f} ms/img), dim {vecs.shape[1]}")
    print(f"saved {INDEX_PATH}")


if __name__ == "__main__":
    main()
