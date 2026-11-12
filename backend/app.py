"""VisionFinder search API. Run: uvicorn app:app --port 8000"""
import time
from contextlib import asynccontextmanager
from io import BytesIO

from fastapi import BackgroundTasks, Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from sqlalchemy.exc import InterfaceError, OperationalError

import auth
from config import CORS_ORIGINS, MAX_UPLOAD, MODEL, PRETRAINED, THRESHOLD_HIGH, THRESHOLD_LOW
from embedder import load_image
from search_engine import SearchEngine

engine: SearchEngine = None


@asynccontextmanager
async def lifespan(_app):
    global engine
    engine = SearchEngine()  # model + index loaded once
    # Warm-up: torch's first forward pass is slow; pay it here instead of on the first visitor's request.
    engine.search_image(Image.new("RGB", (224, 224), "white"), "warm up", 1)
    yield


app = FastAPI(title="VisionFinder API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["GET", "POST", "PUT"], allow_headers=["*"])
app.include_router(auth.router)


# MySQL not running: account endpoints answer 503; search never touches the database on the request path.
@app.exception_handler(OperationalError)
@app.exception_handler(InterfaceError)
def db_down(_request, _exc):
    return JSONResponse({"detail": "Database unavailable"}, status_code=503)


def ms(t0):
    return round((time.perf_counter() - t0) * 1000, 1)


@app.get("/api/health")
def health():
    return {"status": "ok", "products": engine.index.ntotal, "model": f"{MODEL}/{PRETRAINED}",
            "threshold": THRESHOLD_HIGH, "threshold_high": THRESHOLD_HIGH, "threshold_low": THRESHOLD_LOW}


def confidence(score):
    return "high" if score >= THRESHOLD_HIGH else "medium" if score >= THRESHOLD_LOW else "low"


@app.post("/api/search/image")
def search_image(tasks: BackgroundTasks, file: UploadFile = File(...), text: str = Form(None), k: int = Query(12, ge=1, le=50),
                 user_id: int | None = Depends(auth.optional_user_id)):
    t0 = time.perf_counter()  # includes reading + decoding the upload
    data = file.file.read(MAX_UPLOAD + 1)
    if len(data) > MAX_UPLOAD:
        raise HTTPException(413, f"Image is larger than {MAX_UPLOAD // (1024 * 1024)} MB.")
    try:
        img = load_image(BytesIO(data))
    except (OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(400, "File is not a valid image (JPEG, PNG or WebP).")
    results = engine.search_image(img, (text or "").strip(), k)
    top = results[0]["score"] if results else 0.0
    conf = confidence(top)
    tasks.add_task(auth.record_search, user_id, "photo", None, results)
    return {"results": results, "match": conf == "high", "confidence": conf, "top_score": top,
            "threshold": THRESHOLD_HIGH, "threshold_low": THRESHOLD_LOW, "took_ms": ms(t0)}


@app.get("/api/search/text")
def search_text(tasks: BackgroundTasks, q: str = Query(..., min_length=1, max_length=200), k: int = Query(12, ge=1, le=50),
                user_id: int | None = Depends(auth.optional_user_id)):
    t0 = time.perf_counter()
    results = engine.search_text(q.strip(), k)
    tasks.add_task(auth.record_search, user_id, "text", q.strip(), results)
    return {"results": results, "match": bool(results), "took_ms": ms(t0)}  # text search has no threshold


@app.get("/api/similar/{pid}")
def similar(pid: str, k: int = Query(12, ge=1, le=50)):
    t0 = time.perf_counter()
    try:
        results = engine.similar(pid, k)
    except KeyError:
        raise HTTPException(404, f"Unknown product id: {pid}")
    return {"results": results, "took_ms": ms(t0)}
