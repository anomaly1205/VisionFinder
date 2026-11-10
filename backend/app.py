"""VisionFinder search API. Run: uvicorn app:app --port 8000"""
import time
from contextlib import asynccontextmanager
from io import BytesIO

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from config import CORS_ORIGINS, MAX_UPLOAD, MODEL, PRETRAINED, THRESHOLD_HIGH, THRESHOLD_LOW
from embedder import load_image
from search_engine import SearchEngine

engine: SearchEngine = None


@asynccontextmanager
async def lifespan(_app):
    global engine
    engine = SearchEngine()  # model + index loaded once
    yield


app = FastAPI(title="VisionFinder API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["GET", "POST"], allow_headers=["*"])


def ms(t0):
    return round((time.perf_counter() - t0) * 1000, 1)


@app.get("/api/health")
def health():
    return {"status": "ok", "products": engine.index.ntotal, "model": f"{MODEL}/{PRETRAINED}",
            "threshold": THRESHOLD_HIGH, "threshold_high": THRESHOLD_HIGH, "threshold_low": THRESHOLD_LOW}


def confidence(score):
    return "high" if score >= THRESHOLD_HIGH else "medium" if score >= THRESHOLD_LOW else "low"


@app.post("/api/search/image")
def search_image(file: UploadFile = File(...), text: str = Form(None), k: int = Query(12, ge=1, le=50)):
    data = file.file.read(MAX_UPLOAD + 1)
    if len(data) > MAX_UPLOAD:
        raise HTTPException(413, f"Image is larger than {MAX_UPLOAD // (1024 * 1024)} MB.")
    try:
        img = load_image(BytesIO(data))
    except (OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(400, "File is not a valid image (JPEG, PNG or WebP).")
    t0 = time.perf_counter()
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
