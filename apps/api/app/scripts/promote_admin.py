from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models import User
from app.models.enums import UserRole


async def promote_user_to_admin(email: str) -> bool:
    async with AsyncSessionLocal() as session:
        user = await session.scalar(select(User).where(User.email == email.lower()))
        if user is None:
            return False

        user.role = UserRole.ADMIN
        user.is_active = True
        await session.commit()
        return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Temporarily promote a CityPulse user to admin for local MVP demos."
    )
    parser.add_argument("--email", required=True, help="Email of the user to promote.")
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    promoted = await promote_user_to_admin(args.email)
    if not promoted:
        raise SystemExit(f"User not found: {args.email}")

    print(f"Promoted to admin: {args.email.lower()}")


if __name__ == "__main__":
    asyncio.run(main())
