"""POST /api/products: admin key check, then the new product is found by its own image at once."""
import os
import sys
from io import BytesIO

import pytest
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app as app_module  # noqa: E402

KEY = "test-admin-key"


@pytest.fixture(scope="module")
def client(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("added")
    with pytest.MonkeyPatch.context() as mp:  # keep the real backend/data untouched
        mp.setattr(app_module, "ADMIN_KEY", KEY)
        mp.setattr(app_module, "ADDED_JSON", str(tmp / "added_products.json"))
        mp.setattr(app_module, "ADDED_DIR", str(tmp / "added"))
        with TestClient(app_module.app) as c:
            yield c


def odd_image():
    """A synthetic pattern that looks like no catalog photo."""
    img = Image.new("RGB", (400, 400), "#13a")
    d = ImageDraw.Draw(img)
    for i in range(0, 400, 40):
        d.ellipse((i, i, i + 120, i + 60), fill="#f90")
    buf = BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


def add(client, key=KEY, **form):
    data = {"name": "Test lamp", "category": "Lighting", "price": "49.5", **form}
    return client.post("/api/products", files={"file": ("new.png", odd_image(), "image/png")}, data=data,
                       headers={"X-Admin-Key": key} if key else {})


def test_needs_admin_key(client):
    assert add(client, key=None).status_code == 401
    assert add(client, key="wrong").status_code == 401


def test_bad_price(client):
    assert add(client, price="-3").status_code == 422


def test_added_product_found_by_its_image(client):
    before = client.get("/api/health").json()["products"]
    r = add(client)
    assert r.status_code == 201, r.text
    pid = r.json()["id"]
    assert client.get("/api/health").json()["products"] == before + 1
    hits = client.post("/api/search/image?k=3", files={"file": ("q.png", odd_image(), "image/png")}).json()
    assert hits["results"][0]["id"] == pid and hits["top_score"] > 0.99
    saved = app_module.load_added()
    assert saved[-1]["id"] == pid and os.path.exists(os.path.join(app_module.ADDED_DIR, saved[-1]["image"]))
    print(f"add took {r.json()['took_ms']} ms")
