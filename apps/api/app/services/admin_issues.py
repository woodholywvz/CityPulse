from __future__ import annotations

from collections import Counter
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models import (
    AdminActionLog,
    Issue,
    IssueDuplicateLink,
    SwipeFeedback,
    User,
)
from app.models.enums import (
    DuplicateResolutionStatus,
    IssueStatus,
    ModerationState,
    SwipeDirection,
)
from app.schemas.admin import (
    AdminActionLogRead,
    AdminDuplicateLinkRead,
    AdminIssueActionRequest,
    AdminIssueDetailRead,
    AdminIssueDuplicateLinkRequest,
    AdminIssueSummaryRead,
    AdminIssueSupportMetricsRead,
)
from app.schemas.issue import IssueAttachmentRead, IssueCategoryRead
from app.services.admin_audit import AdminAuditService
from app.services.impact_scores import ImpactScoreService
from app.services.moderation import serialize_moderation_result_admin
from app.services.trust_scores import (
    TrustScoreService,
    serialize_admin_identity,
    serialize_integrity_compact,
)


class AdminIssueService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.audit = AdminAuditService(session)
        self.impact_scores = ImpactScoreService(session)
        self.trust_scores = TrustScoreService(session)

    async def list_issues(
        self,
        *,
        limit: int = 50,
        status: IssueStatus | None = None,
        moderation_state: ModerationState | None = None,
        category_id: UUID | None = None,
        author_id: UUID | None = None,
    ) -> list[AdminIssueSummaryRead]:
        statement = (
            select(Issue)
            .options(
                selectinload(Issue.category),
                selectinload(Issue.author).selectinload(User.integrity_snapshot),
                selectinload(Issue.impact_snapshot),
                selectinload(Issue.attachments),
            )
            .order_by(Issue.created_at.desc())
            .limit(limit)
        )
        if status is not None:
            statement = statement.where(Issue.status == status)
        if moderation_state is not None:
            statement = statement.where(Issue.moderation_state == moderation_state)
        if category_id is not None:
            statement = statement.where(Issue.category_id == category_id)
        if author_id is not None:
            statement = statement.where(Issue.author_id == author_id)

        issues = list((await self.session.scalars(statement)).all())
        await self.impact_scores.ensure_issue_metrics(issues, commit=True)
        author_snapshots = await self.trust_scores.ensure_user_snapshots(
            [issue.author_id for issue in issues],
            commit=True,
        )
        issues.sort(
            key=lambda issue: (
                issue.impact_snapshot.public_impact_score if issue.impact_snapshot else 0.0,
                issue.created_at,
            ),
            reverse=True,
        )
        return [serialize_admin_issue_summary(issue, author_snapshots) for issue in issues]

    async def get_issue_detail(self, issue_id: UUID) -> AdminIssueDetailRead:
        issue = await self._load_issue(issue_id)
        await self.impact_scores.ensure_issue_metrics([issue], commit=True)
        author_snapshots = await self.trust_scores.ensure_user_snapshots(
            [issue.author_id],
            commit=True,
        )
        support_metrics = await self._support_metrics(issue.id)
        action_logs = await self._load_action_logs(issue.id)

        return AdminIssueDetailRead(
            issue=serialize_admin_issue_summary(issue, author_snapshots),
            attachments=[
                IssueAttachmentRead.model_validate(attachment) for attachment in issue.attachments
            ],
            moderation_results=[
                serialize_moderation_result_admin(result)
                for result in sorted(issue.moderation_results, key=lambda item: item.created_at)
            ],
            impact=await self.impact_scores.get_admin_breakdown(issue.id),
            support_metrics=support_metrics,
            canonical_duplicates=[
                serialize_admin_duplicate_link(link)
                for link in sorted(
                    issue.canonical_duplicate_links,
                    key=lambda item: item.created_at,
                )
            ],
            duplicate_of=[
                serialize_admin_duplicate_link(link)
                for link in sorted(issue.duplicate_links, key=lambda item: item.created_at)
            ],
            admin_actions=[serialize_admin_action_log(log) for log in action_logs],
        )

    async def apply_action(
        self,
        *,
        issue_id: UUID,
        admin: User,
        payload: AdminIssueActionRequest,
    ) -> AdminIssueDetailRead:
        issue = await self._load_issue(issue_id)
        previous_status = issue.status
        previous_moderation_state = issue.moderation_state

        if payload.action == "approve":
            issue.status = IssueStatus.APPROVED
            issue.moderation_state = ModerationState.COMPLETED
        elif payload.action == "reject":
            issue.status = IssueStatus.REJECTED
            issue.moderation_state = ModerationState.COMPLETED
        elif payload.action == "publish":
            issue.status = IssueStatus.PUBLISHED
            issue.moderation_state = ModerationState.COMPLETED
        elif payload.action == "archive":
            issue.status = IssueStatus.ARCHIVED
            issue.moderation_state = ModerationState.COMPLETED
        elif payload.action == "reopen":
            issue.status = IssueStatus.APPROVED
            issue.moderation_state = ModerationState.COMPLETED
        else:
            raise ValidationError("Unsupported admin issue action.")

        self.audit.record(
            admin=admin,
            action=f"issue.{payload.action}",
            entity_type="issue",
            entity_id=issue.id,
            note=payload.note,
            payload={
                "previous_status": previous_status.value,
                "next_status": issue.status.value,
                "previous_moderation_state": previous_moderation_state.value,
                "next_moderation_state": issue.moderation_state.value,
                "bypass_ai": payload.bypass_ai,
            },
        )
        await self.impact_scores.recalculate_issue(issue.id, commit=False)
        await self.session.commit()
        return await self.get_issue_detail(issue.id)

    async def link_duplicate(
        self,
        *,
        issue_id: UUID,
        admin: User,
        payload: AdminIssueDuplicateLinkRequest,
    ) -> AdminIssueDetailRead:
        duplicate_issue = await self._load_issue(issue_id)
        canonical_issue = await self._load_issue(payload.canonical_issue_id)

        if duplicate_issue.id == canonical_issue.id:
            raise ValidationError("An issue cannot be linked as a duplicate of itself.")

        existing_link = await self.session.scalar(
            select(IssueDuplicateLink).where(
                IssueDuplicateLink.canonical_issue_id == canonical_issue.id,
                IssueDuplicateLink.duplicate_issue_id == duplicate_issue.id,
            )
        )
        if (
            existing_link is not None
            and existing_link.status == DuplicateResolutionStatus.CONFIRMED
        ):
            raise ConflictError("These issues are already linked as duplicates.")

        link = existing_link or IssueDuplicateLink(
            canonical_issue_id=canonical_issue.id,
            duplicate_issue_id=duplicate_issue.id,
            created_by_user_id=admin.id,
        )
        link.status = DuplicateResolutionStatus.CONFIRMED
        link.similarity_score = payload.similarity_score
        link.distance_km = payload.distance_km
        link.text_similarity = payload.text_similarity
        link.category_match = payload.category_match
        link.reason_breakdown = {"reasons": payload.reason_breakdown}
        link.candidate_snapshot = {
            "duplicate_issue_title": duplicate_issue.title,
            "archive_duplicate": payload.archive_duplicate,
        }
        if existing_link is None:
            self.session.add(link)

        if payload.archive_duplicate:
            duplicate_issue.status = IssueStatus.ARCHIVED
            duplicate_issue.moderation_state = ModerationState.COMPLETED

        self.audit.record(
            admin=admin,
            action="issue.link_duplicate",
            entity_type="issue",
            entity_id=duplicate_issue.id,
            note=payload.note,
            payload={
                "canonical_issue_id": str(canonical_issue.id),
                "archive_duplicate": payload.archive_duplicate,
                "similarity_score": payload.similarity_score,
                "distance_km": payload.distance_km,
                "text_similarity": payload.text_similarity,
                "category_match": payload.category_match,
                "reason_breakdown": payload.reason_breakdown,
            },
        )

        await self.impact_scores.recalculate_issue(canonical_issue.id, commit=False)
        await self.impact_scores.recalculate_issue(duplicate_issue.id, commit=False)
        await self.session.commit()
        return await self.get_issue_detail(duplicate_issue.id)

    async def _load_issue(self, issue_id: UUID) -> Issue:
        issue = await self.session.scalar(
            select(Issue)
            .where(Issue.id == issue_id)
            .options(
                selectinload(Issue.category),
                selectinload(Issue.author).selectinload(User.integrity_snapshot),
                selectinload(Issue.attachments),
                selectinload(Issue.impact_snapshot),
                selectinload(Issue.moderation_results),
                selectinload(Issue.canonical_duplicate_links)
                .selectinload(IssueDuplicateLink.duplicate_issue),
                selectinload(Issue.duplicate_links)
                .selectinload(IssueDuplicateLink.canonical_issue),
            )
        )
        if issue is None:
            raise NotFoundError("Issue was not found.")
        return issue

    async def _support_metrics(self, issue_id: UUID) -> AdminIssueSupportMetricsRead:
        feedback_rows = list(
            (
                await self.session.scalars(
                    select(SwipeFeedback).where(SwipeFeedback.issue_id == issue_id)
                )
            ).all()
        )
        support_user_ids = [
            row.user_id
            for row in feedback_rows
            if row.direction.value == "support"
        ]
        weight_map = await self.trust_scores.get_weight_multipliers(support_user_ids, commit=False)
        direction_counts = Counter(row.direction for row in feedback_rows)
        weighted_total = round(
            sum(weight_map.get(user_id, 1.0) for user_id in support_user_ids),
            3,
        )
        return AdminIssueSupportMetricsRead(
            support_count=direction_counts.get(SwipeDirection.SUPPORT, 0),
            trust_weighted_support_total=weighted_total,
            skip_count=direction_counts.get(SwipeDirection.SKIP, 0),
            more_like_this_count=direction_counts.get(SwipeDirection.MORE_LIKE_THIS, 0),
            less_like_this_count=direction_counts.get(SwipeDirection.LESS_LIKE_THIS, 0),
        )

    async def _load_action_logs(self, issue_id: UUID) -> list[AdminActionLog]:
        return list(
            (
                await self.session.scalars(
                    select(AdminActionLog)
                    .where(
                        AdminActionLog.entity_type == "issue",
                        AdminActionLog.entity_id == issue_id,
                    )
                    .options(selectinload(AdminActionLog.admin))
                    .order_by(AdminActionLog.created_at.desc())
                    .limit(25)
                )
            ).all()
        )


def serialize_admin_issue_summary(
    issue: Issue,
    author_snapshots: dict[UUID, object] | None = None,
) -> AdminIssueSummaryRead:
    snapshot = issue.impact_snapshot
    support_count = int(snapshot.signals.get("unique_supporters", 0)) if snapshot else 0
    weighted_support = (
        float(snapshot.signals.get("weighted_support_total", 0.0)) if snapshot else 0.0
    )
    duplicate_count = int(snapshot.signals.get("duplicate_cluster_size", 0)) if snapshot else 0
    author_snapshot = author_snapshots.get(issue.author_id) if author_snapshots else None

    return AdminIssueSummaryRead(
        id=issue.id,
        title=issue.title,
        short_description=issue.short_description,
        status=issue.status,
        moderation_state=issue.moderation_state,
        category=IssueCategoryRead.model_validate(issue.category),
        author=serialize_integrity_compact(issue.author, author_snapshot),
        location_snippet=f"{issue.latitude:.3f}, {issue.longitude:.3f}",
        support_count=support_count,
        trust_weighted_support_total=round(weighted_support, 3),
        duplicate_count=duplicate_count,
        public_impact_score=snapshot.public_impact_score if snapshot else None,
        affected_people_estimate=snapshot.affected_people_estimate if snapshot else None,
        created_at=issue.created_at,
        updated_at=issue.updated_at,
    )


def serialize_admin_duplicate_link(link: IssueDuplicateLink) -> AdminDuplicateLinkRead:
    return AdminDuplicateLinkRead(
        id=link.id,
        status=link.status,
        canonical_issue_id=link.canonical_issue_id,
        duplicate_issue_id=link.duplicate_issue_id,
        canonical_issue_title=link.canonical_issue.title if link.canonical_issue else None,
        duplicate_issue_title=link.duplicate_issue.title if link.duplicate_issue else None,
        similarity_score=link.similarity_score,
        distance_km=link.distance_km,
        text_similarity=link.text_similarity,
        category_match=link.category_match,
        reason_breakdown=list(link.reason_breakdown.get("reasons", [])),
        created_at=link.created_at,
    )


def serialize_admin_action_log(log: AdminActionLog) -> AdminActionLogRead:
    return AdminActionLogRead(
        id=log.id,
        action=log.action,
        entity_type=log.entity_type,
        entity_id=log.entity_id,
        note=log.note,
        payload=log.payload,
        created_at=log.created_at,
        admin=serialize_admin_identity(log.admin) if log.admin is not None else None,
    )
