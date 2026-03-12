"""
Alembic env.py — async SQLite configuration.
"""
import asyncio

from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context

# Import all models so Alembic sees them
from app.models import *  # noqa: F401, F403
from app.database import Base
from app.config import settings

config = context.config

target_metadata = Base.metadata

# Override URL from Settings if provided at runtime
DB_URL = settings.database_url
if DB_URL.startswith("sqlite:///") and "aiosqlite" not in DB_URL:
    DB_URL = DB_URL.replace("sqlite:///", "sqlite+aiosqlite:///", 1)


def run_migrations_offline() -> None:
    context.configure(
        url=DB_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # required for SQLite ALTER TABLE support
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = create_async_engine(DB_URL, connect_args={"check_same_thread": False})
    async with engine.connect() as conn:
        await conn.run_sync(do_run_migrations)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
