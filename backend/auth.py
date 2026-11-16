"""Accounts (register / login with JWT) and per-user cart, wishlist and search history."""
import logging
import os
import re
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

import db
from db import CartItem, SearchHistory, User, WishlistItem, get_db

log = logging.getLogger("visionfinder.auth")

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    # Still works, but every restart logs everyone out. Set JWT_SECRET in backend/.env.
    log.warning("JWT_SECRET is not set: using a random secret for this run")
    JWT_SECRET = secrets.token_urlsafe(32)
TOKEN_DAYS = 7
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PRODUCT_ID = r"^[A-Za-z0-9_-]{1,32}$"

router = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)


# ---- passwords + tokens ----
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def check_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


# Login against an unknown email still runs one bcrypt check, so response time does not reveal which emails exist.
DUMMY_HASH = hash_password(secrets.token_hex(8))


def make_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": exp}, JWT_SECRET, algorithm="HS256")


def token_user_id(cred: HTTPAuthorizationCredentials | None) -> int | None:
    if not cred:
        return None
    try:
        return int(jwt.decode(cred.credentials, JWT_SECRET, algorithms=["HS256"])["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        return None


def optional_user_id(cred: HTTPAuthorizationCredentials | None = Depends(bearer)) -> int | None:
    """For the search endpoints: never fails, and never touches the database."""
    return token_user_id(cred)


def current_user(cred: HTTPAuthorizationCredentials | None = Depends(bearer), s: Session = Depends(get_db)) -> User:
    uid = token_user_id(cred)
    user = s.get(User, uid) if uid is not None else None
    if not user:
        raise HTTPException(401, "Not logged in", headers={"WWW-Authenticate": "Bearer"})
    return user


# ---- schemas ----
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(max_length=255)
    password: str = Field(min_length=8, max_length=72)


class LoginIn(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(max_length=200)


class CartRow(BaseModel):
    id: str = Field(pattern=PRODUCT_ID)
    qty: int = Field(ge=1, le=99)


class CartIn(BaseModel):
    items: list[CartRow] = Field(max_length=200)


class WishlistIn(BaseModel):
    items: list[str] = Field(max_length=500)


def user_out(u: User):
    return {"id": u.id, "name": u.name, "email": u.email, "created_at": u.created_at}


def auth_out(u: User):
    return {"token": make_token(u.id), "user": user_out(u)}


# ---- auth ----
@router.post("/auth/register", status_code=201)
def register(body: RegisterIn, s: Session = Depends(get_db)):
    email = body.email.strip().lower()
    name = body.name.strip()
    if not EMAIL_RE.match(email):
        raise HTTPException(422, "Enter a valid email address.")
    if not name:
        raise HTTPException(422, "Enter your name.")
    if len(body.password.encode()) > 72:  # bcrypt limit
        raise HTTPException(422, "Password is too long.")
    if s.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(409, "An account with this email already exists.")
    user = User(name=name, email=email, password_hash=hash_password(body.password))
    s.add(user)
    try:
        s.commit()
    except IntegrityError:  # same email registered at the same moment
        s.rollback()
        raise HTTPException(409, "An account with this email already exists.")
    s.refresh(user)
    return auth_out(user)


@router.post("/auth/login")
def login(body: LoginIn, s: Session = Depends(get_db)):
    user = s.scalar(select(User).where(User.email == body.email.strip().lower()))
    ok = check_password(body.password, user.password_hash if user else DUMMY_HASH)
    if not (user and ok):
        raise HTTPException(401, "Invalid email or password")
    return auth_out(user)


@router.get("/auth/me")
def me(user: User = Depends(current_user)):
    return user_out(user)


# ---- cart + wishlist: the client sends the whole list, the server stores exactly that ----
@router.get("/me/cart")
def get_cart(user: User = Depends(current_user), s: Session = Depends(get_db)):
    rows = s.scalars(select(CartItem).where(CartItem.user_id == user.id).order_by(CartItem.product_id))
    return {"items": [{"id": r.product_id, "qty": r.quantity} for r in rows]}


@router.put("/me/cart")
def put_cart(body: CartIn, user: User = Depends(current_user), s: Session = Depends(get_db)):
    merged = {}
    for r in body.items:
        merged[r.id] = min(99, merged.get(r.id, 0) + r.qty)
    s.execute(delete(CartItem).where(CartItem.user_id == user.id))
    s.add_all(CartItem(user_id=user.id, product_id=pid, quantity=q) for pid, q in merged.items())
    s.commit()
    return get_cart(user, s)


@router.get("/me/wishlist")
def get_wishlist(user: User = Depends(current_user), s: Session = Depends(get_db)):
    rows = s.scalars(select(WishlistItem.product_id).where(WishlistItem.user_id == user.id).order_by(WishlistItem.product_id))
    return {"items": list(rows)}


@router.put("/me/wishlist")
def put_wishlist(body: WishlistIn, user: User = Depends(current_user), s: Session = Depends(get_db)):
    ids = list(dict.fromkeys(body.items))
    if any(not re.match(PRODUCT_ID, i) for i in ids):
        raise HTTPException(422, "Invalid product id.")
    s.execute(delete(WishlistItem).where(WishlistItem.user_id == user.id))
    s.add_all(WishlistItem(user_id=user.id, product_id=i) for i in ids)
    s.commit()
    return get_wishlist(user, s)


# ---- search history ----
@router.get("/me/history")
def history(user: User = Depends(current_user), s: Session = Depends(get_db)):
    rows = s.scalars(select(SearchHistory).where(SearchHistory.user_id == user.id)
                     .order_by(SearchHistory.created_at.desc(), SearchHistory.id.desc()).limit(20))
    return {"items": [{"type": r.type, "query": r.query, "top_result_id": r.top_result_id, "created_at": r.created_at}
                      for r in rows]}


def record_search(user_id: int | None, kind: str, query: str | None, results: list):
    """Runs after the search response is sent. A database problem must never break search."""
    if user_id is None:
        return
    try:
        with db.SessionLocal() as s:
            if s.get(User, user_id):
                s.add(SearchHistory(user_id=user_id, type=kind, query=(query or None) and query[:200],
                                    top_result_id=results[0]["id"] if results else None))
                s.commit()
    except SQLAlchemyError as e:
        log.warning("search history not saved: %s", e.__class__.__name__)
