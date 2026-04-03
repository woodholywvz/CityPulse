from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def repair_legacy_enum_values(session: AsyncSession) -> None:
    statements = [
        (
            "UPDATE users "
            "SET email = regexp_replace(email, '@citypulse\\.local$', '@citypulse-demo.com') "
            "WHERE email ~ '@citypulse\\.local$'"
        ),
        "UPDATE users SET role = LOWER(role) WHERE role <> LOWER(role)",
        "UPDATE issues SET status = LOWER(status) WHERE status <> LOWER(status)",
        (
            "UPDATE issues "
            "SET moderation_state = LOWER(moderation_state) "
            "WHERE moderation_state <> LOWER(moderation_state)"
        ),
        "UPDATE swipe_feedback SET direction = 'skip' WHERE direction IN ('dismiss', 'DISMISS')",
        (
            "UPDATE swipe_feedback "
            "SET direction = LOWER(direction) "
            "WHERE direction <> LOWER(direction)"
        ),
        (
            "UPDATE moderation_results "
            "SET status = LOWER(status) "
            "WHERE status <> LOWER(status)"
        ),
        (
            "UPDATE moderation_results "
            "SET layer = LOWER(layer) "
            "WHERE layer <> LOWER(layer)"
        ),
        (
            "UPDATE support_tickets "
            "SET ticket_type = LOWER(ticket_type) "
            "WHERE ticket_type <> LOWER(ticket_type)"
        ),
        (
            "UPDATE support_tickets "
            "SET status = LOWER(status) "
            "WHERE status <> LOWER(status)"
        ),
        (
            "UPDATE issue_duplicate_links "
            "SET status = LOWER(status) "
            "WHERE status <> LOWER(status)"
        ),
        (
            "UPDATE user_integrity_snapshots "
            "SET abuse_risk_level = LOWER(abuse_risk_level) "
            "WHERE abuse_risk_level <> LOWER(abuse_risk_level)"
        ),
        (
            "UPDATE integrity_events "
            "SET severity = LOWER(severity) "
            "WHERE severity <> LOWER(severity)"
        ),
    ]

    for statement in statements:
        await session.execute(text(statement))
