from __future__ import annotations

import asyncio

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.scripts.category_seed import seed_categories_in_session
from app.scripts.demo_seed import seed_demo_issues_in_session
from app.scripts.repair_legacy_data import repair_legacy_enum_values
from app.scripts.seed import seed_default_admin_in_session

_bootstrap_lock = asyncio.Lock()
_bootstrap_completed = False


async def bootstrap_database_if_enabled() -> None:
    settings = get_settings()

    if not settings.bootstrap_database_on_startup:
        return

    global _bootstrap_completed

    if _bootstrap_completed:
        return

    async with _bootstrap_lock:
        if _bootstrap_completed:
            return

        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with AsyncSessionLocal() as session:
            await repair_legacy_enum_values(session)
            await seed_categories_in_session(session)
            await seed_default_admin_in_session(session, settings)
            await seed_demo_issues_in_session(session, settings)
            await session.commit()

        _bootstrap_completed = True
