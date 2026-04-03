from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AdminActionLog, User


class AdminAuditService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def record(
        self,
        *,
        admin: User,
        action: str,
        entity_type: str,
        entity_id: UUID | None = None,
        note: str | None = None,
        payload: dict[str, object] | None = None,
    ) -> AdminActionLog:
        log = AdminActionLog(
            admin_id=admin.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            note=note,
            payload=payload or {},
        )
        self.session.add(log)
        return log
