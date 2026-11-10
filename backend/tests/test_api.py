"""API tests. Needs the index: run `python build_index.py` first."""
import json
import os
import sys
from io import BytesIO

import pytest
from PIL import Image
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import app  # noqa: E402
from config import PRODUCTS_JSON, image_path  # noqa: E402
from embedder import load_image  # noqa: E402

with open(PRODUCTS_JSON, encoding="utf-8") as f:
    P = json.load(f)[0]


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:  # runs lifespan: loads model + index
        yield c


def post_image(client, path, text=None):
    with open(path, "rb") as f:
        return client.post("/api/search/image?k=5", files={"file": ("q.webp", f, "image/webp")},
                           data={"text": text} if text else None)


def test_health(client):
    r = client.get("/api/health").json()
    assert r["status"] == "ok" and r["products"] > 0 and 0 < r["threshold_low"] < r["threshold_high"] < 1


def test_catalog_image_finds_itself(client):
    r = post_image(client, image_path(P["image"])).json()
    assert r["results"][0]["id"] == P["id"]
    assert r["match"] is True and r["confidence"] == "high" and r["top_score"] > 0.99
    assert {"took_ms", "threshold"} <= r.keys()


def test_image_plus_text(client):
    r = post_image(client, image_path(P["image"]), text=P["name"]).json()
    assert r["results"][0]["id"] == P["id"]
    assert r["top_score"] == r["results"][0]["score"]  # score stays the image score


def test_text_changes_image_ranking(client):
    ids = lambda text: [x["id"] for x in post_image(client, image_path(P["image"]), text=text).json()["results"]]
    assert ids("round wool area rug") != ids("brass table lamp")


def big_jpeg(w=4000, h=3000):
    buf = BytesIO()
    Image.new("RGB", (w, h), "red").save(buf, "JPEG")
    return buf.getvalue()


def test_large_image_downscaled_before_padding():
    assert load_image(BytesIO(big_jpeg())).size == (1024, 1024)
    assert load_image(BytesIO(big_jpeg(300, 200))).size == (300, 300)  # small images are not upscaled


def test_large_image_upload(client):
    r = client.post("/api/search/image?k=3", files={"file": ("big.jpg", big_jpeg(), "image/jpeg")})
    assert r.status_code == 200 and len(r.json()["results"]) == 3


def test_text_embedding_cached(client):
    from app import engine
    client.get("/api/search/text", params={"q": "cache me please"})
    hits = engine._embed_text.cache_info().hits
    client.get("/api/search/text", params={"q": "cache me please"})
    assert engine._embed_text.cache_info().hits == hits + 1


def test_not_an_image(client):
    r = client.post("/api/search/image", files={"file": ("x.txt", b"hello", "text/plain")})
    assert r.status_code == 400 and "image" in r.json()["detail"]


def test_too_large(client):
    r = client.post("/api/search/image", files={"file": ("big.jpg", b"0" * (10 * 1024 * 1024 + 1), "image/jpeg")})
    assert r.status_code == 413


def test_text_search(client):
    r = client.get("/api/search/text", params={"q": "wooden dining chair", "k": 12}).json()
    assert len(r["results"]) == 12 and r["match"] is True
    assert all(0 <= x["score"] <= 1 for x in r["results"])


def test_similar(client):
    r = client.get(f"/api/similar/{P['id']}?k=12").json()
    assert len(r["results"]) == 12 and P["id"] not in {x["id"] for x in r["results"]}


def test_similar_unknown_id(client):
    assert client.get("/api/similar/NOPE").status_code == 404
