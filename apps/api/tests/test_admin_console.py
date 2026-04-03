from uuid import UUID

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import Issue, IssueDuplicateLink, SupportTicket, User
from app.models.enums import IssueStatus, ModerationState, SupportTicketStatus, UserRole


async def _register_and_login(
    client: AsyncClient,
    session_factory: async_sessionmaker[AsyncSession],
    *,
    email: str,
    full_name: str,
    role: UserRole = UserRole.CITIZEN,
) -> tuple[str, str]:
    password = "SecurePass123!"
    register_response = await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": full_name,
            "preferred_locale": "en",
        },
    )
    assert register_response.status_code == 201

    if role != UserRole.CITIZEN:
        async with session_factory() as session:
            user = await session.scalar(select(User).where(User.email == email))
            assert user is not None
            user.role = role
            await session.commit()

    login_response = await client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200
    return login_response.json()["access_token"], register_response.json()["id"]


async def _create_issue(
    client: AsyncClient,
    token: str,
    *,
    category_id: str,
    title: str,
    latitude: float,
    longitude: float,
) -> str:
    response = await client.post(
        "/api/issues",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": title,
            "short_description": (
                "Street-level issue report with enough detail for operations review."
            ),
            "category_id": category_id,
            "latitude": latitude,
            "longitude": longitude,
            "source_locale": "en",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


async def test_admin_dashboard_issue_operations_and_heatmaps(
    client: AsyncClient,
    seeded_category_id: str,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    admin_token, admin_id = await _register_and_login(
        client,
        session_factory,
        email="ops-admin@example.com",
        full_name="Operations Admin",
        role=UserRole.ADMIN,
    )
    citizen_token, citizen_id = await _register_and_login(
        client,
        session_factory,
        email="citizen@example.com",
        full_name="Citizen Reporter",
    )

    primary_issue_id = await _create_issue(
        client,
        citizen_token,
        category_id=seeded_category_id,
        title="Broken streetlight near River Avenue",
        latitude=43.2389,
        longitude=76.8897,
    )
    duplicate_issue_id = await _create_issue(
        client,
        citizen_token,
        category_id=seeded_category_id,
        title="Streetlight outage beside River Avenue bus stop",
        latitude=43.2393,
        longitude=76.8894,
    )

    publish_response = await client.post(
        f"/api/admin/issues/{primary_issue_id}/actions",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "publish", "note": "Verified by operations desk", "bypass_ai": True},
    )
    assert publish_response.status_code == 200
    assert publish_response.json()["issue"]["status"] == "published"

    link_duplicate_response = await client.post(
        f"/api/admin/issues/{duplicate_issue_id}/duplicates/link",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "canonical_issue_id": primary_issue_id,
            "archive_duplicate": True,
            "similarity_score": 0.92,
            "distance_km": 0.08,
            "text_similarity": 0.88,
            "category_match": True,
            "reason_breakdown": ["Nearby report", "Matching title"],
        },
    )
    assert link_duplicate_response.status_code == 200
    link_body = link_duplicate_response.json()
    assert link_body["issue"]["status"] == "archived"

    dashboard_response = await client.get(
        "/api/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert dashboard_response.status_code == 200
    dashboard = dashboard_response.json()
    assert dashboard["issue_volume"]["total_issues"] >= 2
    assert dashboard["top_priority_issues"]
    assert dashboard["heatmap_preview"]

    issue_detail_response = await client.get(
        f"/api/admin/issues/{primary_issue_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert issue_detail_response.status_code == 200
    issue_detail = issue_detail_response.json()
    assert issue_detail["impact"]["public_impact_score"] >= 0
    assert issue_detail["admin_actions"][0]["admin"]["id"] == admin_id

    heatmap_response = await client.get(
        "/api/admin/analytics/heatmap?limit=12",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert heatmap_response.status_code == 200
    admin_heatmap = heatmap_response.json()
    assert admin_heatmap

    public_heatmap_response = await client.get("/api/public/issues/heatmap?limit=12")
    assert public_heatmap_response.status_code == 200
    public_heatmap = public_heatmap_response.json()
    assert public_heatmap

    async with session_factory() as session:
        issue = await session.scalar(select(Issue).where(Issue.id == UUID(primary_issue_id)))
        assert issue is not None
        assert issue.status == IssueStatus.PUBLISHED
        assert issue.moderation_state == ModerationState.COMPLETED
        duplicate_issue = await session.scalar(
            select(Issue).where(Issue.id == UUID(duplicate_issue_id))
        )
        assert duplicate_issue is not None
        assert duplicate_issue.status == IssueStatus.ARCHIVED
        duplicate_link = await session.scalar(
            select(IssueDuplicateLink).where(
                IssueDuplicateLink.canonical_issue_id == UUID(primary_issue_id),
                IssueDuplicateLink.duplicate_issue_id == UUID(duplicate_issue_id),
            )
        )
        assert duplicate_link is not None
        citizen = await session.scalar(select(User).where(User.id == UUID(citizen_id)))
        assert citizen is not None


async def test_admin_ticket_and_user_operations(
    client: AsyncClient,
    seeded_category_id: str,
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    admin_token, _ = await _register_and_login(
        client,
        session_factory,
        email="service-admin@example.com",
        full_name="Service Admin",
        role=UserRole.ADMIN,
    )
    citizen_token, citizen_id = await _register_and_login(
        client,
        session_factory,
        email="appeal-user@example.com",
        full_name="Appeal User",
    )

    issue_id = await _create_issue(
        client,
        citizen_token,
        category_id=seeded_category_id,
        title="Unsafe crossing near school entrance",
        latitude=43.2401,
        longitude=76.8904,
    )

    async with session_factory() as session:
        issue = await session.scalar(select(Issue).where(Issue.id == UUID(issue_id)))
        assert issue is not None
        issue.status = IssueStatus.REJECTED
        issue.moderation_state = ModerationState.COMPLETED
        await session.commit()

    ticket_response = await client.post(
        "/api/tickets",
        headers={"Authorization": f"Bearer {citizen_token}"},
        json={
            "issue_id": issue_id,
            "type": "appeal",
            "subject": "Please review the rejected issue",
            "message": "I can provide more context and supporting information.",
        },
    )
    assert ticket_response.status_code == 201
    ticket_id = ticket_response.json()["id"]

    ticket_list_response = await client.get(
        "/api/admin/tickets?status=open",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert ticket_list_response.status_code == 200
    ticket_list = ticket_list_response.json()
    assert ticket_list
    assert ticket_list[0]["id"] == ticket_id

    reply_response = await client.post(
        f"/api/admin/tickets/{ticket_id}/reply",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "body": "Operations received the appeal and queued a manual review.",
            "is_internal": False,
            "status": "under_review",
        },
    )
    assert reply_response.status_code == 200
    reply_body = reply_response.json()
    assert reply_body["status"] == "under_review"
    assert len(reply_body["messages"]) == 2

    status_response = await client.post(
        f"/api/admin/tickets/{ticket_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "waiting_for_user", "note": "Waiting for new photos"},
    )
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "waiting_for_user"

    user_profile_response = await client.get(
        f"/api/admin/users/{citizen_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert user_profile_response.status_code == 200
    user_profile = user_profile_response.json()
    assert user_profile["identity"]["id"] == citizen_id
    assert "reaction_patterns" in user_profile

    ban_response = await client.post(
        f"/api/admin/users/{citizen_id}/ban",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"note": "Temporary hold during review"},
    )
    assert ban_response.status_code == 200
    assert ban_response.json()["identity"]["is_active"] is False

    unban_response = await client.post(
        f"/api/admin/users/{citizen_id}/unban",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"note": "Review complete"},
    )
    assert unban_response.status_code == 200
    assert unban_response.json()["identity"]["is_active"] is True

    async with session_factory() as session:
        ticket = await session.scalar(
            select(SupportTicket).where(SupportTicket.id == UUID(ticket_id))
        )
        assert ticket is not None
        assert ticket.status == SupportTicketStatus.WAITING_FOR_USER
        citizen = await session.scalar(select(User).where(User.id == UUID(citizen_id)))
        assert citizen is not None
        assert citizen.is_active is True
