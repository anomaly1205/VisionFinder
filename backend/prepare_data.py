"""Build demo catalog from Amazon Berkeley Objects (ABO). Stdlib only.

Usage: python backend/prepare_data.py [ABO_ROOT]   (default F:\\Download\\ABO)
"""
import csv
import glob
import gzip
import json
import os
import random
import sys
import time
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor

ABO = sys.argv[1] if len(sys.argv) > 1 else r"F:\Download\ABO"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONT = os.path.join(ROOT, "frontend")
IMG_DIR = os.path.join(FRONT, "assets", "products")
DATA_DIR = os.path.join(FRONT, "data")
URL = "https://amazon-berkeley-objects.s3.amazonaws.com/images/small/{}"
SEED = 42
N_CATALOG, N_HOLDOUT, MAX_EXTRA = 500, 100, 2

# product_type -> category; ambiguous types (HOME, HOME_BED_AND_BATH, ...) left out on purpose.
CATEGORY = {
    "Furniture": ["CHAIR", "SOFA", "TABLE", "STOOL_SEATING", "OTTOMAN", "HEADBOARD", "SHELF", "BED",
                  "CABINET", "DESK", "FURNITURE", "DRESSER", "BED_FRAME", "BENCH"],
    "Lighting": ["LIGHT_FIXTURE", "LAMP", "HOME_LIGHTING_AND_LAMPS", "STRING_LIGHT"],
    "Rugs": ["RUG", "RUG_PAD"],
    "Decor": ["WALL_ART", "CLOCK", "HOME_MIRROR", "VASE", "CANDLE", "CANDLE_HOLDER", "CURTAIN"],
    "Storage": ["STORAGE_BOX", "BASKET", "STORAGE_BAG", "STORAGE_RACK", "STORAGE_DRAWER",
                "HOME_ORGANIZERS_AND_STORAGE", "JEWELRY_STORAGE"],
    "Plants": ["PLANTER", "ARTIFICIAL_PLANT", "ARTIFICIAL_TREE"],
    "Bedding": ["PILLOW", "FLAT_SHEET", "BLANKET"],
}
TYPE2CAT = {t: c for c, ts in CATEGORY.items() for t in ts}
PRICE = {"Furniture": (80, 900), "Lighting": (20, 250), "Rugs": (40, 400), "Decor": (10, 150),
         "Storage": (10, 90), "Plants": (15, 120), "Bedding": (15, 160)}


def en_value(field):
    """First English value of an ABO multilingual field, else first value, else ''."""
    field = field or []
    for x in field:
        if x.get("language_tag", "").startswith("en"):
            return x["value"].strip()
    return field[0]["value"].strip() if field else ""


def load_items():
    items, seen_img = defaultdict(list), set()
    for f in sorted(glob.glob(os.path.join(ABO, "listings", "metadata", "listings_*.json.gz"))):
        with gzip.open(f, "rt", encoding="utf-8") as fh:
            for line in fh:
                d = json.loads(line)
                ptype = (d.get("product_type") or [{}])[0].get("value")
                cat = TYPE2CAT.get(ptype)
                main, others = d.get("main_image_id"), d.get("other_image_id") or []
                names = [n for n in d.get("item_name", []) if n.get("language_tag", "").startswith("en")]
                # dedupe by main image: ABO lists colour/size variants sharing one photo
                if not cat or not main or not others or not names or main in seen_img:
                    continue
                seen_img.add(main)
                items[cat].append({
                    "id": d["item_id"], "name": names[0]["value"].strip(), "category": cat,
                    "product_type": ptype, "color": en_value(d.get("color")),
                    "brand": en_value(d.get("brand")), "main": main, "others": others[:MAX_EXTRA],
                })
    return items


def load_paths():
    with gzip.open(os.path.join(ABO, "images.csv.gz"), "rt", encoding="utf-8") as fh:
        return {r["image_id"]: r["path"] for r in csv.DictReader(fh)}


def split_balanced(items, rng):
    cats = sorted(items)
    for c in cats:
        items[c].sort(key=lambda x: x["id"])  # stable order before shuffle -> reproducible
        rng.shuffle(items[c])

    def quota(total):
        q = {c: total // len(cats) for c in cats}
        for c in cats[: total % len(cats)]:
            q[c] += 1
        return q

    qc, qh = quota(N_CATALOG), quota(N_HOLDOUT)
    catalog, holdout = [], []
    for c in cats:
        if len(items[c]) < qc[c] + qh[c]:
            sys.exit(f"Not enough items in {c}: {len(items[c])}")
        catalog += items[c][: qc[c]]
        holdout += items[c][qc[c]: qc[c] + qh[c]]
    return catalog, holdout


def download(job):
    image_id, path = job
    dest = os.path.join(IMG_DIR, f"{image_id}.jpg")
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return "skip"
    for attempt in range(4):
        try:
            with urllib.request.urlopen(URL.format(path), timeout=30) as r:
                data = r.read()
            with open(dest + ".part", "wb") as fh:
                fh.write(data)
            os.replace(dest + ".part", dest)
            return "ok"
        except Exception as e:  # network errors: back off and retry
            err = e
            time.sleep(2 ** attempt)
    print(f"FAIL {image_id}: {err}")
    return "fail"


def to_record(p, rng, ok_ids):
    img = lambda i: f"assets/products/{i}.jpg"
    extra = [i for i in p["others"] if i in ok_ids]
    lo, hi = PRICE[p["category"]]
    return {
        "id": p["id"], "name": p["name"], "category": p["category"], "product_type": p["product_type"],
        "color": p["color"], "brand": p["brand"], "price": round(rng.uniform(lo, hi)) - 0.01,
        "image": img(p["main"]), "gallery": [img(p["main"])] + [img(i) for i in extra],
        "query_images": [img(i) for i in extra],  # other angles: use as visual-search queries
    }


def main():
    rng = random.Random(SEED)
    items = load_items()
    print("Eligible per category:", {c: len(v) for c, v in sorted(items.items())})
    catalog, holdout = split_balanced(items, rng)
    paths = load_paths()

    jobs = {i: paths[i] for p in catalog + holdout for i in [p["main"]] + p["others"] if i in paths}
    os.makedirs(IMG_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    with ThreadPoolExecutor(16) as ex:
        results = dict(zip(jobs, ex.map(download, jobs.items())))
    ok_ids = {i for i, r in results.items() if r != "fail"}

    # drop products whose main image failed
    catalog = [p for p in catalog if p["main"] in ok_ids]
    holdout = [p for p in holdout if p["main"] in ok_ids]
    price_rng = random.Random(SEED + 1)
    out = {"products.json": [to_record(p, price_rng, ok_ids) for p in catalog],
           "holdout.json": [to_record(p, price_rng, ok_ids) for p in holdout]}
    assert not {p["id"] for p in out["products.json"]} & {p["id"] for p in out["holdout.json"]}
    for name, recs in out.items():
        with open(os.path.join(DATA_DIR, name), "w", encoding="utf-8") as fh:
            json.dump(recs, fh, ensure_ascii=False, indent=2)

    print("Catalog per category:", dict(sorted(Counter(p["category"] for p in catalog).items())))
    print("Holdout per category:", dict(sorted(Counter(p["category"] for p in holdout).items())))
    print(f"Total catalog={len(catalog)} holdout={len(holdout)}")
    c = Counter(results.values())
    print(f"Images: downloaded={c['ok']} skipped(existing)={c['skip']} failed={c['fail']} total_ok={len(ok_ids)}")


if __name__ == "__main__":
    main()
