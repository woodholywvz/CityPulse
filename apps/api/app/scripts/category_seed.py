from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import IssueCategory

DEFAULT_CATEGORIES = [
    {
        "slug": "roads",
        "display_name": "Roads",
        "description": "Potholes, damaged surfaces, and road safety issues.",
        "severity_baseline": 0.72,
        "affected_people_baseline": 45,
    },
    {
        "slug": "sanitation",
        "display_name": "Sanitation",
        "description": "Garbage, dumping, and public cleanliness concerns.",
        "severity_baseline": 0.58,
        "affected_people_baseline": 35,
    },
    {
        "slug": "lighting",
        "display_name": "Lighting",
        "description": "Streetlight outages and dark public areas.",
        "severity_baseline": 0.64,
        "affected_people_baseline": 28,
    },
    {
        "slug": "safety",
        "display_name": "Safety",
        "description": "Hazards, public safety risks, and dangerous infrastructure.",
        "severity_baseline": 0.86,
        "affected_people_baseline": 70,
    },
    {
        "slug": "transport",
        "display_name": "Transport",
        "description": "Bus stops, transit access, and street mobility issues.",
        "severity_baseline": 0.68,
        "affected_people_baseline": 55,
    },
]


async def seed_categories_in_session(session: AsyncSession) -> int:
    existing_slugs = set(
        (
            await session.scalars(
                select(IssueCategory.slug).where(
                    IssueCategory.slug.in_([item["slug"] for item in DEFAULT_CATEGORIES])
                )
            )
        ).all()
    )

    created_count = 0
    for category in DEFAULT_CATEGORIES:
        if category["slug"] in existing_slugs:
            existing_category = await session.scalar(
                select(IssueCategory).where(IssueCategory.slug == category["slug"])
            )
            if existing_category is not None:
                existing_category.display_name = category["display_name"]
                existing_category.description = category["description"]
                existing_category.severity_baseline = category["severity_baseline"]
                existing_category.affected_people_baseline = category[
                    "affected_people_baseline"
                ]
            continue

        session.add(IssueCategory(**category))
        created_count += 1

    return created_count
