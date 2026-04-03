# ruff: noqa: E501

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import hash_password
from app.models import (
    Issue,
    IssueAttachment,
    IssueCategory,
    ModerationResult,
    SwipeFeedback,
    User,
)
from app.models.enums import (
    IssueStatus,
    ModerationLayer,
    ModerationResultStatus,
    ModerationState,
    SwipeDirection,
    UserRole,
)
from app.services.impact_scores import ImpactScoreService

DEMO_USERS = [
    ("demo.citizen01@citypulse-demo.com", "Aruzhan Sadykova", "ru"),
    ("demo.citizen02@citypulse-demo.com", "Maksat Orazbayev", "kk-cyrl"),
    ("demo.citizen03@citypulse-demo.com", "Dana Ilyasova", "en"),
    ("demo.citizen04@citypulse-demo.com", "Alibek Tursyn", "kk-latn"),
    ("demo.citizen05@citypulse-demo.com", "Amina Nurpeis", "ru"),
    ("demo.citizen06@citypulse-demo.com", "Timur Akhmetov", "en"),
    ("demo.citizen07@citypulse-demo.com", "Zhanel Bekova", "kk-cyrl"),
    ("demo.citizen08@citypulse-demo.com", "Ruslan Karim", "ru"),
    ("demo.citizen09@citypulse-demo.com", "Madina Taizhan", "kk-latn"),
    ("demo.citizen10@citypulse-demo.com", "Eldar Abiken", "en"),
]

DEMO_PHOTO_URLS = {
    "roads": [
        "https://picsum.photos/seed/citypulse-roads-01/1400/900",
        "https://picsum.photos/seed/citypulse-roads-02/1400/900",
        "https://picsum.photos/seed/citypulse-roads-03/1400/900",
    ],
    "sanitation": [
        "https://picsum.photos/seed/citypulse-sanitation-01/1400/900",
        "https://picsum.photos/seed/citypulse-sanitation-02/1400/900",
        "https://picsum.photos/seed/citypulse-sanitation-03/1400/900",
    ],
    "lighting": [
        "https://picsum.photos/seed/citypulse-lighting-01/1400/900",
        "https://picsum.photos/seed/citypulse-lighting-02/1400/900",
        "https://picsum.photos/seed/citypulse-lighting-03/1400/900",
    ],
    "safety": [
        "https://picsum.photos/seed/citypulse-safety-01/1400/900",
        "https://picsum.photos/seed/citypulse-safety-02/1400/900",
        "https://picsum.photos/seed/citypulse-safety-03/1400/900",
    ],
    "transport": [
        "https://picsum.photos/seed/citypulse-transport-01/1400/900",
        "https://picsum.photos/seed/citypulse-transport-02/1400/900",
        "https://picsum.photos/seed/citypulse-transport-03/1400/900",
    ],
}

DEMO_ISSUES = [
    (
        "Potholes deepening near Abay and Baitursynov",
        "Several potholes are opening in the right lane near the Abay and Baitursynov intersection, forcing cars to brake sharply and shift lanes.",
        "roads",
        43.2388,
        76.9274,
        "ru",
        0,
        2,
        7,
        False,
    ),
    (
        "Overflowing bins behind Green Bazaar loading area",
        "Garbage containers behind the Green Bazaar are overflowing into the service lane and attracting birds and stray animals by the morning delivery zone.",
        "sanitation",
        43.2624,
        76.9448,
        "ru",
        4,
        4,
        6,
        False,
    ),
    (
        "Streetlights out along the Koktem riverside path",
        "A chain of streetlights is dark on the Koktem riverside walking path, making the route hard to use safely after sunset for pedestrians and cyclists.",
        "lighting",
        43.2307,
        76.9135,
        "en",
        2,
        1,
        5,
        False,
    ),
    (
        "Broken railing beside school crossing in Aksai-2",
        "The metal safety railing near the school crossing in Aksai-2 is bent outward, leaving children close to moving traffic during morning drop-off.",
        "safety",
        43.2322,
        76.8429,
        "kk-cyrl",
        6,
        5,
        8,
        False,
    ),
    (
        "Bus shelter roof leaking at Sairan stop",
        "Passengers at the Sairan bus stop have little cover because rainwater is coming through the shelter roof and pooling around the bench area.",
        "transport",
        43.2406,
        76.8664,
        "ru",
        7,
        3,
        6,
        False,
    ),
    (
        "Cracked asphalt forming along Al-Farabi slip lane",
        "A long strip of cracked asphalt is turning into uneven surface near the Al-Farabi slip lane and may damage tires if left untreated.",
        "roads",
        43.2195,
        76.9288,
        "en",
        5,
        7,
        4,
        False,
    ),
    (
        "Illegal dumping appearing near Zhetysu market edge",
        "Household waste bags are being dumped repeatedly near the edge of the Zhetysu market parking strip and are not being cleared on time.",
        "sanitation",
        43.2751,
        76.8893,
        "kk-latn",
        8,
        6,
        5,
        False,
    ),
    (
        "Dark pedestrian underpass at Raiymbek Avenue",
        "The pedestrian underpass entrance near Raiymbek Avenue remains dim because several fixtures are not working and the stair edges are difficult to see.",
        "lighting",
        43.2685,
        76.9183,
        "ru",
        0,
        9,
        7,
        False,
    ),
    (
        "Loose utility cover beside Orbita playground",
        "A utility cover next to the Orbita playground shifts when stepped on and could injure children using the footpath beside the play area.",
        "safety",
        43.2016,
        76.8895,
        "kk-cyrl",
        1,
        2,
        7,
        False,
    ),
    (
        "Crowded curbside boarding at Dostyk Plaza buses",
        "Passengers queue in the roadway because the curbside boarding area near Dostyk Plaza is narrow and the stop layout forces people into traffic.",
        "transport",
        43.2337,
        76.9561,
        "en",
        9,
        8,
        5,
        False,
    ),
    (
        "Raised manhole near Tole Bi creating hard impact",
        "The raised manhole cover on Tole Bi Avenue causes a strong jolt for drivers and is especially noticeable for buses and delivery vehicles.",
        "roads",
        43.2568,
        76.8829,
        "ru",
        4,
        11,
        4,
        False,
    ),
    (
        "Waste not collected near private houses in Alatau district",
        "Household waste has remained on the curb for multiple collection cycles in part of Alatau district and is starting to spread across the lane.",
        "sanitation",
        43.3021,
        76.7825,
        "kk-cyrl",
        6,
        10,
        6,
        False,
    ),
    (
        "Lamp posts dim along Panfilov promenade edge",
        "Several lamps near the edge of the Panfilov promenade are much dimmer than the rest, leaving patches of low visibility late in the evening.",
        "lighting",
        43.2585,
        76.9459,
        "ru",
        7,
        12,
        4,
        False,
    ),
    (
        "Open trench left beside sidewalk in Shanyrak",
        "A shallow trench beside the sidewalk in Shanyrak has no visible barrier or reflective warning, which is risky for people walking after dark.",
        "safety",
        43.3284,
        76.7921,
        "kk-latn",
        3,
        14,
        7,
        False,
    ),
    (
        "Damaged timetable board at Sayakhat terminal",
        "The timetable board at one side of Sayakhat terminal is broken and route information is missing, making transfers difficult for occasional riders.",
        "transport",
        43.2659,
        76.9513,
        "en",
        2,
        13,
        3,
        False,
    ),
    (
        "Repeated pothole patch failure near Medeu bus turn",
        "A previously patched pothole near the Medeu bus turning area has broken open again and is collecting water across the lane edge.",
        "roads",
        43.1636,
        77.0521,
        "ru",
        0,
        18,
        5,
        False,
    ),
    (
        "Overflowing public bins near First President Park entrance",
        "The row of public bins near the First President Park entrance is regularly overflowing during weekends and litter is spreading into the grass verge.",
        "sanitation",
        43.2027,
        76.8854,
        "en",
        5,
        16,
        4,
        False,
    ),
    (
        "Underlit bus approach near Kazakhstan Hotel",
        "The approach to the bus stop near the Kazakhstan Hotel is noticeably underlit, which makes the curb edge and waiting zone harder to see.",
        "lighting",
        43.2449,
        76.9578,
        "ru",
        4,
        15,
        3,
        False,
    ),
    (
        "Collapsed curb stone near children clinic entrance",
        "A line of curb stones has collapsed near the entrance to a children clinic, creating an uneven drop for parents with strollers.",
        "safety",
        43.2497,
        76.9036,
        "kk-cyrl",
        1,
        19,
        6,
        False,
    ),
    (
        "Missing shelter side panel at Orbita bus stop",
        "The bus shelter in Orbita is missing one side panel, so wind and rain blow directly into the waiting area during bad weather.",
        "transport",
        43.2044,
        76.8867,
        "kk-latn",
        8,
        17,
        4,
        False,
    ),
    (
        "Uneven resurfacing along Satpayev frontage road",
        "The recent resurfacing on the Satpayev frontage road left a rough step between old and new asphalt, especially noticeable near the turning pocket.",
        "roads",
        43.2404,
        76.9098,
        "en",
        9,
        22,
        3,
        False,
    ),
    (
        "Litter gathering around Esentai River seating area",
        "Small litter and drink containers are accumulating around the Esentai River seating area and do not appear to be cleared frequently enough.",
        "sanitation",
        43.2209,
        76.9272,
        "ru",
        7,
        21,
        2,
        False,
    ),
    (
        "Park pathway lights flickering in Family Park",
        "Several lights along a Family Park pathway are flickering instead of staying fully lit, leaving the route inconsistent and distracting at night.",
        "lighting",
        43.2408,
        76.8421,
        "kk-cyrl",
        6,
        20,
        4,
        False,
    ),
    (
        "Exposed rebar at sidewalk edge near construction fence",
        "Short exposed rebar is visible beside a sidewalk near a temporary construction fence and needs covering before someone trips or gets injured.",
        "safety",
        43.2482,
        76.9365,
        "en",
        2,
        23,
        5,
        False,
    ),
    (
        "Route signage missing at transfer stop near Moskva center",
        "The transfer stop near Moskva center lacks clear route signage for one direction, so passengers frequently wait in the wrong place.",
        "transport",
        43.2379,
        76.8455,
        "ru",
        0,
        24,
        3,
        False,
    ),
    (
        "Aging asphalt breaking near lower Furmanov incline",
        "Older asphalt is breaking into loose chunks near the lower Furmanov incline, which is beginning to scatter debris across the lane edge.",
        "roads",
        43.2491,
        76.9536,
        "ru",
        4,
        28,
        4,
        True,
    ),
    (
        "Dumped renovation debris near small courtyard bins",
        "Bags of renovation debris were left beside normal courtyard bins, blocking access for residents and likely preventing proper waste collection.",
        "sanitation",
        43.2478,
        76.8784,
        "kk-cyrl",
        1,
        29,
        3,
        True,
    ),
    (
        "Side-street light line still inactive in Mamyr",
        "A side-street line of lamps in Mamyr remains inactive after earlier repairs, leaving the residential connector darker than nearby blocks.",
        "lighting",
        43.2262,
        76.8237,
        "ru",
        7,
        30,
        2,
        True,
    ),
    (
        "Damaged pedestrian barrier near school stadium corner",
        "The pedestrian barrier at a school stadium corner is partially detached and no longer guides foot traffic away from the roadway.",
        "safety",
        43.2157,
        76.8513,
        "en",
        5,
        32,
        3,
        True,
    ),
    (
        "Bus bay markings faded near central park edge",
        "The bus bay markings near the central park edge are fading badly and drivers stop inconsistently, making boarding less predictable.",
        "transport",
        43.2485,
        76.9394,
        "kk-latn",
        8,
        33,
        2,
        True,
    ),
]


async def _ensure_demo_user(
    session: AsyncSession,
    *,
    email: str,
    full_name: str,
    preferred_locale: str,
) -> User:
    user = await session.scalar(select(User).where(User.email == email))
    if user is not None:
        user.full_name = full_name
        user.preferred_locale = preferred_locale
        user.is_active = True
        return user

    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password("DemoPass123!"),
        role=UserRole.CITIZEN,
        preferred_locale=preferred_locale,
        is_active=True,
    )
    session.add(user)
    return user


async def seed_demo_issues_in_session(
    session: AsyncSession,
    settings: Settings,
) -> int:
    if not settings.seed_demo_data:
        return 0

    existing_count = int(
        await session.scalar(
            select(func.count(Issue.id))
            .join(User, Issue.author_id == User.id)
            .where(User.email.like("demo.citizen%@citypulse-demo.com"))
        )
        or 0
    )
    if existing_count >= len(DEMO_ISSUES):
        existing_demo_issues = (
            await session.scalars(
                select(Issue)
                .join(User, Issue.author_id == User.id)
                .where(User.email.like("demo.citizen%@citypulse-demo.com"))
            )
        ).all()
        await ImpactScoreService(session).ensure_issue_metrics(existing_demo_issues, commit=False)
        return 0

    users_by_email: dict[str, User] = {}
    for email, full_name, preferred_locale in DEMO_USERS:
        users_by_email[email] = await _ensure_demo_user(
            session,
            email=email,
            full_name=full_name,
            preferred_locale=preferred_locale,
        )
    await session.flush()

    category_lookup = {
        category.slug: category
        for category in (
            await session.scalars(select(IssueCategory).where(IssueCategory.is_active.is_(True)))
        ).all()
    }
    existing_titles = set(
        (
            await session.scalars(
                select(Issue.title)
                .join(User, Issue.author_id == User.id)
                .where(User.email.like("demo.citizen%@citypulse-demo.com"))
            )
        ).all()
    )

    demo_users = list(users_by_email.values())
    now = datetime.now(UTC)
    created_count = 0

    for index, spec in enumerate(DEMO_ISSUES):
        (
            title,
            short_description,
            category_slug,
            latitude,
            longitude,
            source_locale,
            author_index,
            days_ago,
            support_target,
            archived,
        ) = spec
        if title in existing_titles:
            continue

        category = category_lookup[category_slug]
        author_email = DEMO_USERS[author_index][0]
        author = users_by_email[author_email]
        created_at = now - timedelta(days=days_ago)
        issue = Issue(
            author_id=author.id,
            category_id=category.id,
            title=title,
            short_description=short_description,
            latitude=latitude,
            longitude=longitude,
            status=IssueStatus.ARCHIVED if archived else IssueStatus.PUBLISHED,
            moderation_state=ModerationState.COMPLETED,
            source_locale=source_locale,
        )
        issue.created_at = created_at
        issue.updated_at = created_at + timedelta(hours=6)
        session.add(issue)
        await session.flush()

        photo_url = DEMO_PHOTO_URLS[category_slug][index % len(DEMO_PHOTO_URLS[category_slug])]
        attachment = IssueAttachment(
            issue_id=issue.id,
            uploader_id=author.id,
            storage_key=f"demo/{category_slug}/{index + 1}.jpg",
            original_filename=f"{category_slug}-{index + 1}.jpg",
            content_type="image/jpeg",
            size_bytes=420_000 + index * 7_500,
            moderation_image_url=photo_url,
        )
        attachment.created_at = created_at + timedelta(minutes=5)
        attachment.updated_at = attachment.created_at
        session.add(attachment)

        moderation_result = ModerationResult(
            issue_id=issue.id,
            status=ModerationResultStatus.APPROVED,
            layer=ModerationLayer.DETERMINISTIC,
            decision_code="approved_seed",
            provider_name="seed",
            model_name="seed-demo-data",
            machine_reasons=[],
            user_safe_explanation="Seeded demo issue approved for local review.",
            internal_notes="Generated local demo issue for the CityPulse MVP dataset.",
            escalation_required=False,
            flags={"seeded_demo": True},
            confidence=0.94,
            summary="Approved seeded issue for local operations demo.",
        )
        moderation_result.created_at = created_at + timedelta(minutes=10)
        moderation_result.updated_at = moderation_result.created_at
        session.add(moderation_result)

        rotated_users = (
            demo_users[index % len(demo_users) :] + demo_users[: index % len(demo_users)]
        )
        added_supports = 0
        for supporter in rotated_users:
            if supporter.id == author.id or added_supports >= support_target:
                continue
            feedback = SwipeFeedback(
                user_id=supporter.id,
                issue_id=issue.id,
                direction=SwipeDirection.SUPPORT,
            )
            feedback.created_at = created_at + timedelta(hours=1 + added_supports)
            feedback.updated_at = feedback.created_at
            session.add(feedback)
            added_supports += 1

        created_count += 1

    demo_issues = (
        await session.scalars(
            select(Issue)
            .join(User, Issue.author_id == User.id)
            .where(User.email.like("demo.citizen%@citypulse-demo.com"))
        )
    ).all()
    await ImpactScoreService(session).ensure_issue_metrics(demo_issues, commit=False)
    return created_count
