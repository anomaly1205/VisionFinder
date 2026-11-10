"""Make 400 px WebP thumbnails for cards and galleries, and add a "thumb" field to the product JSON files.

Run after prepare_data.py (which rewrites the JSON without "thumb"): python make_thumbs.py
Skips thumbnails that already exist.
"""
import json
import os

from PIL import Image, ImageOps

from config import FRONTEND, HOLDOUT_JSON, PRODUCTS_JSON

SIZE = 400
QUALITY = 80


def thumb_of(rel):
    """assets/products/abc.webp -> assets/thumbs/abc.webp (same rule as thumbOf in common.js)."""
    return "assets/thumbs/" + os.path.splitext(os.path.basename(rel))[0] + ".webp"


def make(rel):
    out = os.path.join(FRONTEND, thumb_of(rel))
    if os.path.exists(out):
        return 0
    with Image.open(os.path.join(FRONTEND, rel)) as im:
        im = ImageOps.exif_transpose(im)
        im.thumbnail((SIZE, SIZE))
        im.save(out, "WEBP", quality=QUALITY, method=6)
    return 1


def main():
    os.makedirs(os.path.join(FRONTEND, "assets", "thumbs"), exist_ok=True)
    made = 0
    for path in (PRODUCTS_JSON, HOLDOUT_JSON):
        with open(path, encoding="utf-8") as f:
            recs = json.load(f)
        for p in recs:
            for rel in {p["image"], *p["gallery"]}:
                made += make(rel)
            p["thumb"] = thumb_of(p["image"])
        with open(path, "w", encoding="utf-8") as f:
            json.dump(recs, f, ensure_ascii=False, indent=2)
    print(f"{made} thumbnails written")


if __name__ == "__main__":
    main()
