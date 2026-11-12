"""VisionFinder search API. Run: uvicorn app:app --port 8000"""
import json
import logging
import os
import secrets
import threading
import time
import uuid
from contextlib import asynccontextmanager
from io import BytesIO

from fastapi import FastAPI, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from config import ADDED_DIR, ADDED_JSON, ADMIN_KEY, CORS_ORIGINS, MAX_UPLOAD, MODEL, PRETRAINED, THRESHOLD_HIGH, THRESHOLD_LOW
from embedder import load_image
from search_engine import SearchEngine

engine: SearchEngine = None
added_lock = threading.Lock()  # one writer at a time for added_products.json
log = logging.getLogger("visionfinder")


def load_added():
    if not os.path.exists(ADDED_JSON):
        return []
    with open(ADDED_JSON, encoding="utf-8") as f:
        return json.load(f)


@asynccontextmanager
async def lifespan(_app):
    global engine
    engine = SearchEngine()  # model + index loaded once
    # Products added through POST /api/products are not in the FAISS file: re-embed them (~60 ms each).
    for p in load_added():
        try:
            engine.add(p["id"], load_image(os.path.join(ADDED_DIR, p["image"])))
        except OSError:
            log.warning("added product %s: image missing, skipped", p["id"])
    # Warm-up: torch's first forward pass is slow; pay it here instead of on the first visitor's request.
    engine.search_image(Image.new("RGB", (224, 224), "white"), "warm up", 1)
    yield


app = FastAPI(title="VisionFinder API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["GET", "POST"], allow_headers=["*"])


def ms(t0):
    return round((time.perf_counter() - t0) * 1000, 1)


@app.get("/api/health")
def health():
    return {"status": "ok", "products": engine.products, "model": f"{MODEL}/{PRETRAINED}",
            "threshold": THRESHOLD_HIGH, "threshold_high": THRESHOLD_HIGH, "threshold_low": THRESHOLD_LOW}


def confidence(score):
    return "high" if score >= THRESHOLD_HIGH else "medium" if score >= THRESHOLD_LOW else "low"


@app.post("/api/search/image")
def search_image(file: UploadFile = File(...), text: str = Form(None), k: int = Query(12, ge=1, le=50)):
    t0 = time.perf_counter()  # includes reading + decoding the upload
    _, img = read_image(file)
    results = engine.search_image(img, (text or "").strip(), k)
    top = results[0]["score"] if results else 0.0
    conf = confidence(top)
    return {"results": results, "match": conf == "high", "confidence": conf, "top_score": top,
            "threshold": THRESHOLD_HIGH, "threshold_low": THRESHOLD_LOW, "took_ms": ms(t0)}


@app.get("/api/search/text")
def search_text(q: str = Query(..., min_length=1, max_length=200), k: int = Query(12, ge=1, le=50)):
    t0 = time.perf_counter()
    results = engine.search_text(q.strip(), k)
    return {"results": results, "match": bool(results), "took_ms": ms(t0)}  # text search has no threshold


@app.get("/api/similar/{pid}")
def similar(pid: str, k: int = Query(12, ge=1, le=50)):
    t0 = time.perf_counter()
    try:
        results = engine.similar(pid, k)
    except KeyError:
        raise HTTPException(404, f"Unknown product id: {pid}")
    return {"results": results, "took_ms": ms(t0)}


def read_image(file):
    """Upload -> (bytes, padded PIL image). Raises 413 / 400."""
    data = file.file.read(MAX_UPLOAD + 1)
    if len(data) > MAX_UPLOAD:
        raise HTTPException(413, f"Image is larger than {MAX_UPLOAD // (1024 * 1024)} MB.")
    try:
        return data, load_image(BytesIO(data))
    except (OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(400, "File is not a valid image (JPEG, PNG or WebP).")


@app.post("/api/products", status_code=201)
def add_product(file: UploadFile = File(...), name: str = Form(..., min_length=1, max_length=200),
                category: str = Form(..., min_length=1, max_length=50), price: float = Form(..., gt=0, lt=1e6),
                x_admin_key: str = Header(None)):
    """Add one product and make it searchable at once (no index rebuild). Needs the X-Admin-Key header."""
    if not ADMIN_KEY:
        raise HTTPException(503, "Adding products is disabled: set ADMIN_KEY on the server.")
    if not x_admin_key or not secrets.compare_digest(x_admin_key.encode(), ADMIN_KEY.encode()):
        raise HTTPException(401, "Invalid admin key")
    t0 = time.perf_counter()
    data, img = read_image(file)
    pid = f"vf-{uuid.uuid4().hex[:12]}"
    rec = {"id": pid, "name": name.strip(), "category": category.strip(), "price": round(price, 2),
           "image": f"{pid}.img"}  # original bytes; Pillow sniffs the format on load
    with added_lock:
        os.makedirs(ADDED_DIR, exist_ok=True)
        with open(os.path.join(ADDED_DIR, rec["image"]), "wb") as f:
            f.write(data)
        items = load_added() + [rec]
        tmp = ADDED_JSON + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=1)
        os.replace(tmp, ADDED_JSON)  # atomic: a crash never leaves half a file
        engine.add(pid, img)
    return {**rec, "took_ms": ms(t0)}
