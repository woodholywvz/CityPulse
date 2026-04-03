from __future__ import annotations

import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models import User
from app.models.enums import UserRole
from app.scripts.category_seed import seed_categories_in_session
from app.scripts.demo_seed import seed_demo_issues_in_session
from app.scripts.repair_legacy_data import repair_legacy_enum_values


async def seed_categories() -> int:
    created_count = 0

    async with AsyncSessionLocal() as session:
        created_count = await seed_categories_in_session(session)
        await session.commit()

    return created_count


async def seed_default_admin_in_session(
    session: AsyncSession,
    settings: Settings,
) -> bool:
    existing_admin = await session.scalar(
        select(User).where(User.email == settings.default_admin_email.lower())
    )

    if existing_admin is not None:
        return False

    admin = User(
        email=settings.default_admin_email.lower(),
        full_name=settings.default_admin_full_name,
        hashed_password=hash_password(settings.default_admin_password),
        role=UserRole.ADMIN,
        preferred_locale="en",
    )
    session.add(admin)
    return True


async def seed_default_admin(settings: Settings) -> bool:
    async with AsyncSessionLocal() as session:
        created = await seed_default_admin_in_session(session, settings)
        await session.commit()
        return created


async def main() -> None:
    settings = get_settings()
    async with AsyncSessionLocal() as session:
        await repair_legacy_enum_values(session)
        categories_created = await seed_categories_in_session(session)
        admin_created = await seed_default_admin_in_session(session, settings)
        demo_issues_created = await seed_demo_issues_in_session(session, settings)
        await session.commit()

    print(f"Seeded categories: {categories_created}")
    print(f"Default admin created: {admin_created}")
    print(f"Seeded demo Almaty issues: {demo_issues_created}")


if __name__ == "__main__":
    asyncio.run(main())
