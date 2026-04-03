from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.models import IntegrityEvent, Issue, ModerationResult, SupportTicket, SwipeFeedback, User
from app.schemas.admin import (
    AdminUserActionRequest,
    AdminUserIssueHistoryRead,
    AdminUserModerationHistoryRead,
    AdminUserProfileRead,
    AdminUserReactionPatternRead,
    AdminUserTicketHistoryRead,
)
from app.schemas.user import IntegrityFactorRead
from app.services.admin_audit import AdminAuditService
from app.services.impact_scores import ImpactScoreService
from app.services.trust_scores import (
    TrustScoreService,
    serialize_admin_identity,
    serialize_integrity_compact,
    serialize_integrity_event,
)


class AdminUserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.audit = AdminAuditService(session)
        self.trust_scores = TrustScoreService(session)
        self.impact_scores = ImpactScoreService(session)

    async def get_user_profile(self, user_id: UUID) -> AdminUserProfileRead:
        await self.trust_scores.recalculate_user(user_id, commit=True)
        user = await self.session.scalar(
            select(User).where(User.id == user_id).options(selectinload(User.integrity_snapshot))
        )
        if user is None:
            raise NotFoundError("User was not found.")

        recent_events = list(
            (
                await self.session.scalars(
                    select(IntegrityEvent)
                    .where(IntegrityEvent.user_id == user_id)
                    .order_by(IntegrityEvent.created_at.desc())
                    .limit(20)
                )
            ).all()
        )
        recent_issues = list(
            (
                await self.session.scalars(
                    select(Issue)
                    .where(Issue.author_id == user_id)
                    .options(selectinload(Issue.impact_snapshot))
                    .order_by(Issue.created_at.desc())
                    .limit(12)
                )
            ).all()
        )
        await self.impact_scores.ensure_issue_metrics(recent_issues, commit=True)
        recent_tickets = list(
            (
                await self.session.scalars(
                    select(SupportTicket)
                    .where(SupportTicket.author_id == user_id)
                    .order_by(SupportTicket.created_at.desc())
                    .limit(12)
                )
            ).all()
        )
        moderation_history = list(
            (
                await self.session.execute(
                    select(ModerationResult, Issue.title)
                    .join(Issue, ModerationResult.issue_id == Issue.id)
                    .where(Issue.author_id == user_id)
                    .order_by(ModerationResult.created_at.desc())
                    .limit(20)
                )
            ).all()
        )
        reaction_rows = list(
            (
                await self.session.execute(
                    select(SwipeFeedback.direction, func.count(SwipeFeedback.id))
                    .where(SwipeFeedback.user_id == user_id)
                    .group_by(SwipeFeedback.direction)
                )
            ).all()
        )

        snapshot = user.integrity_snapshot
        return AdminUserProfileRead(
            identity=serialize_admin_identity(user),
            integrity=serialize_integrity_compact(user, snapshot),
            recent_events=[serialize_integrity_event(event) for event in recent_events],
            trust_factors=[
                IntegrityFactorRead.model_validate(item)
                for item in (snapshot.trust_breakdown.get("factors", []) if snapshot else [])
            ],
            abuse_factors=[
                IntegrityFactorRead.model_validate(item)
                for item in (snapshot.abuse_summary.get("factors", []) if snapshot else [])
            ],
            recommended_actions=list(
                snapshot.abuse_summary.get("recommended_actions", []) if snapshot else []
            ),
            metrics=snapshot.metrics if snapshot is not None else {},
            recent_issues=[
                AdminUserIssueHistoryRead(
                    id=issue.id,
                    title=issue.title,
                    status=issue.status,
                    moderation_state=issue.moderation_state,
                    public_impact_score=(
                        issue.impact_snapshot.public_impact_score if issue.impact_snapshot else None
                    ),
                    created_at=issue.created_at,
                )
                for issue in recent_issues
            ],
            recent_tickets=[
                AdminUserTicketHistoryRead(
                    id=ticket.id,
                    subject=ticket.subject,
                    ticket_type=ticket.ticket_type,
                    status=ticket.status,
                    issue_id=ticket.issue_id,
                    created_at=ticket.created_at,
                )
                for ticket in recent_tickets
            ],
            moderation_history=[
                AdminUserModerationHistoryRead(
                    issue_id=result.issue_id,
                    issue_title=issue_title,
                    layer=result.layer.value,
                    status=result.status.value,
                    decision_code=result.decision_code,
                    created_at=result.created_at,
                )
                for result, issue_title in moderation_history
            ],
            reaction_patterns=[
                AdminUserReactionPatternRead(action=action, count=int(count))
                for action, count in reaction_rows
            ],
        )

    async def set_user_active(
        self,
        *,
        user_id: UUID,
        admin: User,
        active: bool,
        payload: AdminUserActionRequest,
    ) -> AdminUserProfileRead:
        user = await self.session.scalar(select(User).where(User.id == user_id))
        if user is None:
            raise NotFoundError("User was not found.")

        previous_is_active = user.is_active
        user.is_active = active
        self.audit.record(
            admin=admin,
            action="user.unban" if active else "user.ban",
            entity_type="user",
            entity_id=user.id,
            note=payload.note,
            payload={
                "previous_is_active": previous_is_active,
                "next_is_active": active,
            },
        )
        await self.session.commit()
        return await self.get_user_profile(user.id)
