"""MySQL storage for accounts, carts, wishlists and search history.

Settings come from backend/.env (see .env.example). Create the database and tables with:
    python db.py
"""
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from sqlalchemy import DateTime, ForeignKey, Integer, String, create_engine, func, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
DEFAULT_URL = "mysql+pymysql://root:@127.0.0.1:3306/visionfinder?charset=utf8mb4"


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class CartItem(Base):
    __tablename__ = "cart_items"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    product_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    quantity: Mapped[int] = mapped_column(Integer)


class WishlistItem(Base):
    __tablename__ = "wishlist_items"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    product_id: Mapped[str] = mapped_column(String(32), primary_key=True)


class SearchHistory(Base):
    __tablename__ = "search_history"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(10))  # "photo" or "text"
    query: Mapped[str | None] = mapped_column(String(200), nullable=True)  # empty for photo searches
    top_result_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    # Set in Python (UTC) so the order is exact even when two searches land in the same second.
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))


engine = None
SessionLocal = None


def configure(url=None):
    """(Re)build the engine. Tests call this with a SQLite URL."""
    global engine, SessionLocal
    url = url or os.environ.get("DATABASE_URL") or DEFAULT_URL
    # MySQL down must fail fast (auth -> 503) instead of hanging the request.
    args = {"connect_timeout": 3} if url.startswith("mysql") else {}
    engine = create_engine(url, pool_pre_ping=True, connect_args=args)
    SessionLocal = sessionmaker(engine, expire_on_commit=False)


configure()


def get_db():
    with SessionLocal() as s:
        yield s


def init_db():
    """Create the database (MySQL only) and every table that does not exist yet."""
    url = make_url(str(engine.url))
    if url.get_backend_name() == "mysql" and url.database:
        server = create_engine(url.set(database=None), connect_args={"connect_timeout": 3})
        with server.connect() as c:
            c.execute(text(f"CREATE DATABASE IF NOT EXISTS `{url.database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        server.dispose()
    Base.metadata.create_all(engine)


if __name__ == "__main__":
    init_db()
    print(f"Database ready: {engine.url.render_as_string(hide_password=True)}")
