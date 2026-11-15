"""Auth, cart/wishlist sync and search history. Uses a temporary SQLite file: no MySQL, no model, no index."""
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app as app_module  # noqa: E402
import db  # noqa: E402


class FakeEngine:
    """Stands in for the CLIP search engine so these tests stay fast."""
    def search_text(self, q, k):
        return [{"id": "B07TEST001", "score": 0.31}]


@pytest.fixture
def client(tmp_path, monkeypatch):
    db.configure(f"sqlite:///{tmp_path / 'test.db'}")
    db.init_db()
    monkeypatch.setattr(app_module, "engine", FakeEngine())
    yield TestClient(app_module.app)  # no `with`: skips lifespan, so the real model is not loaded
    db.engine.dispose()
    db.configure()


def register(client, email="ana@example.com", password="correct-horse", name="Ana"):
    return client.post("/api/auth/register", json={"name": name, "email": email, "password": password})


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_register_returns_token_and_user(client):
    r = register(client)
    assert r.status_code == 201
    body = r.json()
    assert body["token"] and body["user"]["email"] == "ana@example.com" and body["user"]["name"] == "Ana"
    assert "password_hash" not in body["user"]


def test_register_rejects_short_password_and_bad_email(client):
    assert register(client, password="short").status_code == 422
    assert register(client, email="not-an-email").status_code == 422


def test_register_duplicate_email(client):
    assert register(client).status_code == 201
    r = register(client, email="ANA@example.com ")  # same address, different case/space
    assert r.status_code == 409


def test_login_right_and_wrong(client):
    register(client)
    ok = client.post("/api/auth/login", json={"email": "ana@example.com", "password": "correct-horse"})
    assert ok.status_code == 200 and ok.json()["token"]
    for email, pw in [("ana@example.com", "wrong-password"), ("nobody@example.com", "correct-horse")]:
        r = client.post("/api/auth/login", json={"email": email, "password": pw})
        assert r.status_code == 401 and r.json()["detail"] == "Invalid email or password"


def test_me_needs_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers=auth("garbage")).status_code == 401
    token = register(client).json()["token"]
    me = client.get("/api/auth/me", headers=auth(token)).json()
    assert me["email"] == "ana@example.com" and "password_hash" not in me


def test_cart_and_wishlist_sync(client):
    token = register(client).json()["token"]
    assert client.get("/api/me/cart").status_code == 401
    assert client.get("/api/me/cart", headers=auth(token)).json() == {"items": []}
    items = [{"id": "B07A", "qty": 2}, {"id": "B07B", "qty": 1}]
    assert client.put("/api/me/cart", json={"items": items}, headers=auth(token)).status_code == 200
    assert client.get("/api/me/cart", headers=auth(token)).json()["items"] == items
    client.put("/api/me/cart", json={"items": [{"id": "B07B", "qty": 3}]}, headers=auth(token))  # replaces
    assert client.get("/api/me/cart", headers=auth(token)).json()["items"] == [{"id": "B07B", "qty": 3}]
    assert client.put("/api/me/cart", json={"items": [{"id": "B07A", "qty": 0}]}, headers=auth(token)).status_code == 422

    client.put("/api/me/wishlist", json={"items": ["B07C", "B07A", "B07C"]}, headers=auth(token))
    assert client.get("/api/me/wishlist", headers=auth(token)).json()["items"] == ["B07A", "B07C"]
    # Another user sees their own empty lists.
    other = register(client, email="bo@example.com").json()["token"]
    assert client.get("/api/me/cart", headers=auth(other)).json()["items"] == []


def test_search_history_saved_only_when_logged_in(client):
    token = register(client).json()["token"]
    assert client.get("/api/search/text?q=oak+chair").status_code == 200  # anonymous: nothing saved
    for q in ["blue rug", "brass lamp"]:
        assert client.get(f"/api/search/text?q={q}", headers=auth(token)).status_code == 200
    items = client.get("/api/me/history", headers=auth(token)).json()["items"]
    assert [i["query"] for i in items] == ["brass lamp", "blue rug"]  # newest first
    assert items[0]["type"] == "text" and items[0]["top_result_id"] == "B07TEST001"


def test_database_down_auth_503_search_still_works(client):
    db.configure("mysql+pymysql://root:@127.0.0.1:1/visionfinder")  # nothing listens on port 1
    token = app_module.auth.make_token(1)
    r = register(client)
    assert r.status_code == 503 and r.json()["detail"] == "Database unavailable"
    assert client.get("/api/auth/me", headers=auth(token)).status_code == 503
    r = client.get("/api/search/text?q=rug", headers=auth(token))  # history write fails quietly
    assert r.status_code == 200 and r.json()["results"]
