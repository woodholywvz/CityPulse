from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from statistics import mean
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    IntegrityEvent,
    Issue,
    IssueDuplicateLink,
    ModerationResult,
    SupportTicket,
    SwipeFeedback,
    User,
)
from app.models.enums import (
    AbuseRiskLevel,
    IssueStatus,
    ModerationResultStatus,
    ModerationState,
    SupportTicketStatus,
    SupportTicketType,
    SwipeDirection,
)
from app.schemas.admin import (
    AdminActivityTrendPointRead,
    AdminDashboardIssueVolumeRead,
    AdminDashboardModerationRead,
    AdminDashboardReactionRead,
    AdminDashboardRead,
    AdminDashboardTicketQueueRead,
    AdminDashboardTrustRead,
    AdminDistributionItemRead,
    AdminHeatPointRead,
    AdminImpactDistributionBucketRead,
    AdminSupportTrendPointRead,
    AdminTopAreaRead,
    PublicHeatPointRead,
)
from app.services.admin_issues import AdminIssueService
from app.services.admin_moderation import AdminModerationService
from app.services.admin_tickets import AdminTicketService
from app.services.impact_scores import ImpactScoreService
from app.services.intelligence_utils import clamp
from app.services.trust_scores import TrustScoreService


@dataclass(frozen=True)
class HeatmapFilters:
    category_id: UUID | None = None
    status: IssueStatus | None = None
    moderation_state: ModerationState | None = None
    days: int = 120
    minimum_public_score: float = 0.0


class AdminAnalyticsService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.impact_scores = ImpactScoreService(session)
        self.trust_scores = TrustScoreService(session)

    async def get_dashboard(self) -> AdminDashboardRead:
        top_priority_issues = await AdminIssueService(self.session).list_issues(limit=6)
        recent_moderation = await AdminModerationService(self.session).list_recent_issues(limit=6)
        recent_tickets = await AdminTicketService(self.session).list_tickets(limit=6)

        return AdminDashboardRead(
            issue_volume=await self.get_issue_volume_overview(),
            moderation_overview=await self.get_moderation_overview(),
            impact_distribution=await self.get_impact_distribution(),
            top_priority_issues=top_priority_issues[:6],
            trust_overview=await self.get_trust_overview(),
            ticket_queue=await self.get_ticket_queue_overview(),
            reaction_overview=await self.get_reaction_overview(),
            activity_trends=await self.get_activity_trends(granularity="week", periods=10),
            recent_tickets=recent_tickets,
            recent_moderation=recent_moderation,
            heatmap_preview=await self.get_admin_heatmap(limit=18),
        )

    async def get_issue_volume_overview(self) -> AdminDashboardIssueVolumeRead:
        issues = list((await self.session.scalars(select(Issue))).all())
        seven_days_ago = datetime.now(UTC) - timedelta(days=7)
        return AdminDashboardIssueVolumeRead(
            total_issues=len(issues),
            new_last_7_days=sum(
                1
                for issue in issues
                if _ensure_utc(issue.created_at) >= seven_days_ago
            ),
            published_count=sum(
                1 for issue in issues if issue.status == IssueStatus.PUBLISHED
            ),
            pending_count=sum(
                1
                for issue in issues
                if issue.status == IssueStatus.PENDING_MODERATION
            ),
            archived_count=sum(1 for issue in issues if issue.status == IssueStatus.ARCHIVED),
        )

    async def get_moderation_overview(self) -> AdminDashboardModerationRead:
        results = list((await self.session.scalars(select(ModerationResult))).all())
        counts = Counter(result.status for result in results)
        return AdminDashboardModerationRead(
            approved_count=counts.get(ModerationResultStatus.APPROVED, 0),
            rejected_count=counts.get(ModerationResultStatus.REJECTED, 0),
            needs_review_count=counts.get(ModerationResultStatus.NEEDS_REVIEW, 0),
            queued_count=counts.get(ModerationResultStatus.QUEUED, 0),
        )

    async def get_trust_overview(self) -> AdminDashboardTrustRead:
        user_ids = list((await self.session.scalars(select(User.id))).all())
        snapshots = await self.trust_scores.ensure_user_snapshots(user_ids, commit=True)
        users = list((await self.session.scalars(select(User))).all())
        average_trust_score = round(
            mean(snapshot.trust_score for snapshot in snapshots.values()) if snapshots else 0.0,
            1,
        )
        return AdminDashboardTrustRead(
            average_trust_score=average_trust_score,
            high_abuse_risk_users=sum(
                1
                for snapshot in snapshots.values()
                if snapshot.abuse_risk_level == AbuseRiskLevel.HIGH
            ),
            medium_abuse_risk_users=sum(
                1
                for snapshot in snapshots.values()
                if snapshot.abuse_risk_level == AbuseRiskLevel.MEDIUM
            ),
            banned_users=sum(1 for user in users if not user.is_active),
            sanctioned_users=sum(
                1 for snapshot in snapshots.values() if snapshot.sanction_count > 0
            ),
        )

    async def get_ticket_queue_overview(self) -> AdminDashboardTicketQueueRead:
        tickets = list((await self.session.scalars(select(SupportTicket))).all())
        status_counts = Counter(ticket.status for ticket in tickets)
        type_counts = Counter(ticket.ticket_type for ticket in tickets)
        return AdminDashboardTicketQueueRead(
            open_count=status_counts.get(SupportTicketStatus.OPEN, 0),
            under_review_count=status_counts.get(SupportTicketStatus.UNDER_REVIEW, 0),
            waiting_for_user_count=status_counts.get(SupportTicketStatus.WAITING_FOR_USER, 0),
            resolved_count=status_counts.get(SupportTicketStatus.RESOLVED, 0)
            + status_counts.get(SupportTicketStatus.CLOSED, 0),
            appeal_count=type_counts.get(SupportTicketType.APPEAL, 0),
            bug_report_count=type_counts.get(SupportTicketType.BUG_REPORT, 0),
            improvement_count=type_counts.get(SupportTicketType.IMPROVEMENT, 0),
        )

    async def get_reaction_overview(self) -> AdminDashboardReactionRead:
        feedback = list((await self.session.scalars(select(SwipeFeedback))).all())
        counts = Counter(item.direction for item in feedback)
        return AdminDashboardReactionRead(
            support_count=counts.get(SwipeDirection.SUPPORT, 0),
            skip_count=counts.get(SwipeDirection.SKIP, 0),
            more_like_this_count=counts.get(SwipeDirection.MORE_LIKE_THIS, 0),
            less_like_this_count=counts.get(SwipeDirection.LESS_LIKE_THIS, 0),
        )

    async def get_activity_trends(
        self,
        *,
        granularity: str = "day",
        periods: int = 30,
    ) -> list[AdminActivityTrendPointRead]:
        cutoff = self._cutoff_for_granularity(granularity, periods)
        issues = list(
            (
                await self.session.scalars(
                    select(Issue).where(Issue.created_at >= cutoff)
                )
            ).all()
        )
        feedback = list(
            (
                await self.session.scalars(
                    select(SwipeFeedback).where(SwipeFeedback.created_at >= cutoff)
                )
            ).all()
        )
        tickets = list(
            (
                await self.session.scalars(
                    select(SupportTicket).where(SupportTicket.created_at >= cutoff)
                )
            ).all()
        )
        buckets = self._empty_buckets(granularity, periods)
        for issue in issues:
            key = self._bucket_start(_ensure_utc(issue.created_at), granularity)
            buckets[key]["issues"] += 1
        for item in feedback:
            key = self._bucket_start(_ensure_utc(item.created_at), granularity)
            buckets[key]["support"] += 1
        for ticket in tickets:
            key = self._bucket_start(_ensure_utc(ticket.created_at), granularity)
            buckets[key]["tickets"] += 1
        return [
            AdminActivityTrendPointRead(
                bucket_start=key,
                label=self._format_bucket_label(key, granularity),
                issue_submissions=values["issues"],
                support_actions=values["support"],
                tickets_created=values["tickets"],
            )
            for key, values in sorted(buckets.items())
        ]

    async def get_support_trends(
        self,
        *,
        granularity: str = "day",
        periods: int = 30,
    ) -> list[AdminSupportTrendPointRead]:
        cutoff = self._cutoff_for_granularity(granularity, periods)
        feedback = list(
            (
                await self.session.scalars(
                    select(SwipeFeedback).where(SwipeFeedback.created_at >= cutoff)
                )
            ).all()
        )
        buckets = self._empty_buckets(granularity, periods)
        for item in feedback:
            key = self._bucket_start(_ensure_utc(item.created_at), granularity)
            buckets[key][item.direction.value] += 1
        return [
            AdminSupportTrendPointRead(
                bucket_start=key,
                label=self._format_bucket_label(key, granularity),
                support=values["support"],
                skip=values["skip"],
                more_like_this=values["more_like_this"],
                less_like_this=values["less_like_this"],
            )
            for key, values in sorted(buckets.items())
        ]

    async def get_category_distribution(self) -> list[AdminDistributionItemRead]:
        rows = list(
            (
                await self.session.execute(
                    select(Issue.category_id, func.count(Issue.id)).group_by(Issue.category_id)
                )
            ).all()
        )
        issues = list(
            (
                await self.session.scalars(
                    select(Issue).options(selectinload(Issue.category))
                )
            ).all()
        )
        category_map = {issue.category_id: issue.category.display_name for issue in issues}
        total = sum(int(count) for _, count in rows) or 1
        return [
            AdminDistributionItemRead(
                key=str(category_id),
                label=category_map.get(category_id, "Unknown"),
                count=int(count),
                share=round(int(count) / total, 3),
            )
            for category_id, count in sorted(rows, key=lambda item: item[1], reverse=True)
        ]

    async def get_moderation_outcomes(self) -> list[AdminDistributionItemRead]:
        rows = list(
            (
                await self.session.execute(
                    select(ModerationResult.status, func.count(ModerationResult.id))
                    .group_by(ModerationResult.status)
                )
            ).all()
        )
        total = sum(int(count) for _, count in rows) or 1
        return [
            AdminDistributionItemRead(
                key=status.value,
                label=status.value.replace("_", " ").title(),
                count=int(count),
                share=round(int(count) / total, 3),
            )
            for status, count in sorted(rows, key=lambda item: item[1], reverse=True)
        ]

    async def get_trust_distribution(self) -> list[AdminDistributionItemRead]:
        user_ids = list((await self.session.scalars(select(User.id))).all())
        snapshots = await self.trust_scores.ensure_user_snapshots(user_ids, commit=True)
        buckets = {
            "high_trust": lambda value: value >= 75,
            "steady_trust": lambda value: 55 <= value < 75,
            "watchlist": lambda value: value < 55,
        }
        total = max(len(snapshots), 1)
        results: list[AdminDistributionItemRead] = []
        for key, matcher in buckets.items():
            count = sum(1 for snapshot in snapshots.values() if matcher(snapshot.trust_score))
            results.append(
                AdminDistributionItemRead(
                    key=key,
                    label=key.replace("_", " ").title(),
                    count=count,
                    share=round(count / total, 3),
                )
            )
        return results

    async def get_abuse_incidents(
        self,
        *,
        days: int = 90,
    ) -> list[AdminDistributionItemRead]:
        cutoff = datetime.now(UTC) - timedelta(days=days)
        rows = list(
            (
                await self.session.execute(
                    select(IntegrityEvent.event_type, func.count(IntegrityEvent.id))
                    .where(IntegrityEvent.created_at >= cutoff)
                    .group_by(IntegrityEvent.event_type)
                )
            ).all()
        )
        total = sum(int(count) for _, count in rows) or 1
        return [
            AdminDistributionItemRead(
                key=event_type,
                label=event_type.replace("_", " ").title(),
                count=int(count),
                share=round(int(count) / total, 3),
            )
            for event_type, count in sorted(rows, key=lambda item: item[1], reverse=True)
        ]

    async def get_impact_distribution(self) -> list[AdminImpactDistributionBucketRead]:
        issues = await self._load_scored_issues()
        buckets = [
            ("0-2.5", 0.0, 2.5),
            ("2.5-5", 2.5, 5.0),
            ("5-7.5", 5.0, 7.5),
            ("7.5-10", 7.5, 10.1),
        ]
        results: list[AdminImpactDistributionBucketRead] = []
        for range_key, min_score, max_score in buckets:
            count = sum(
                1
                for issue in issues
                if issue.impact_snapshot
                and min_score <= issue.impact_snapshot.public_impact_score < max_score
            )
            results.append(
                AdminImpactDistributionBucketRead(
                    range_key=range_key,
                    min_score=min_score,
                    max_score=min(max_score, 10.0),
                    count=count,
                )
            )
        return results

    async def get_top_areas(self, *, limit: int = 12) -> list[AdminTopAreaRead]:
        points = await self._build_heatmap_points(
            filters=HeatmapFilters(days=180),
            published_only=False,
        )
        return [
            AdminTopAreaRead(
                area_key=point.area_key,
                label=point.label,
                issue_count=point.issue_count,
                total_impact_score=round(
                    (point.average_impact_score or 0.0) * point.issue_count,
                    2,
                ),
                average_impact_score=round(point.average_impact_score or 0.0, 2),
                latitude=point.latitude,
                longitude=point.longitude,
                dominant_category_slug=point.top_category_slug,
            )
            for point in sorted(
                points,
                key=lambda item: (
                    item.issue_count,
                    item.average_impact_score or 0.0,
                ),
                reverse=True,
            )[:limit]
        ]

    async def get_duplicate_concentration(
        self,
        *,
        limit: int = 12,
    ) -> list[AdminDistributionItemRead]:
        rows = list(
            (
                await self.session.execute(
                    select(
                        IssueDuplicateLink.canonical_issue_id,
                        Issue.title,
                        func.count(IssueDuplicateLink.id),
                    )
                    .join(Issue, Issue.id == IssueDuplicateLink.canonical_issue_id)
                    .group_by(IssueDuplicateLink.canonical_issue_id, Issue.title)
                    .order_by(func.count(IssueDuplicateLink.id).desc())
                    .limit(limit)
                )
            ).all()
        )
        total = sum(int(count) for _, _, count in rows) or 1
        return [
            AdminDistributionItemRead(
                key=str(issue_id),
                label=title,
                count=int(count),
                share=round(int(count) / total, 3),
            )
            for issue_id, title, count in rows
        ]

    async def get_admin_heatmap(
        self,
        *,
        limit: int = 200,
        filters: HeatmapFilters | None = None,
    ) -> list[AdminHeatPointRead]:
        points = await self._build_heatmap_points(
            filters=filters or HeatmapFilters(),
            published_only=False,
        )
        return sorted(points, key=lambda item: item.intensity, reverse=True)[:limit]

    async def get_public_heatmap(
        self,
        *,
        limit: int = 120,
        category_id: UUID | None = None,
        days: int = 180,
    ) -> list[PublicHeatPointRead]:
        points = await self._build_heatmap_points(
            filters=HeatmapFilters(category_id=category_id, days=days),
            published_only=True,
        )
        return [
            PublicHeatPointRead(
                area_key=point.area_key,
                label=point.label,
                latitude=point.latitude,
                longitude=point.longitude,
                intensity=point.intensity,
                issue_count=point.issue_count,
                top_category_slug=point.top_category_slug,
            )
            for point in sorted(points, key=lambda item: item.intensity, reverse=True)[:limit]
        ]

    async def _load_scored_issues(self) -> list[Issue]:
        issues = list(
            (
                await self.session.scalars(
                    select(Issue)
                    .options(selectinload(Issue.category), selectinload(Issue.impact_snapshot))
                )
            ).all()
        )
        await self.impact_scores.ensure_issue_metrics(issues, commit=True)
        return issues

    async def _build_heatmap_points(
        self,
        *,
        filters: HeatmapFilters,
        published_only: bool,
    ) -> list[AdminHeatPointRead]:
        cutoff = datetime.now(UTC) - timedelta(days=filters.days)
        statement = (
            select(Issue)
            .where(Issue.created_at >= cutoff)
            .options(selectinload(Issue.category), selectinload(Issue.impact_snapshot))
        )
        if published_only:
            statement = statement.where(Issue.status == IssueStatus.PUBLISHED)
        if filters.category_id is not None:
            statement = statement.where(Issue.category_id == filters.category_id)
        if filters.status is not None:
            statement = statement.where(Issue.status == filters.status)
        if filters.moderation_state is not None:
            statement = statement.where(Issue.moderation_state == filters.moderation_state)

        issues = list((await self.session.scalars(statement)).all())
        await self.impact_scores.ensure_issue_metrics(issues, commit=True)
        user_ids = [issue.author_id for issue in issues]
        user_weights = await self.trust_scores.get_weight_multipliers(user_ids, commit=True)

        buckets: dict[str, list[Issue]] = defaultdict(list)
        for issue in issues:
            score = issue.impact_snapshot.public_impact_score if issue.impact_snapshot else 0.0
            if score < filters.minimum_public_score:
                continue
            buckets[self._area_key(issue.latitude, issue.longitude)].append(issue)

        points: list[AdminHeatPointRead] = []
        for area_key, bucket_issues in buckets.items():
            latitude = round(mean(issue.latitude for issue in bucket_issues), 4)
            longitude = round(mean(issue.longitude for issue in bucket_issues), 4)
            issue_count = len(bucket_issues)
            average_impact = round(
                mean(
                    issue.impact_snapshot.public_impact_score if issue.impact_snapshot else 0.0
                    for issue in bucket_issues
                ),
                2,
            )
            trust_weighted_activity = round(
                sum(
                    (
                        issue.impact_snapshot.signals.get("weighted_support_total", 0.0)
                        if issue.impact_snapshot
                        else 0.0
                    )
                    + user_weights.get(issue.author_id, 1.0)
                    for issue in bucket_issues
                ),
                3,
            )
            duplicate_count = sum(
                int(issue.impact_snapshot.signals.get("duplicate_cluster_size", 0))
                if issue.impact_snapshot
                else 0
                for issue in bucket_issues
            )
            needs_review_count = sum(
                1
                for issue in bucket_issues
                if issue.moderation_state == ModerationState.UNDER_REVIEW
            )
            published_count = sum(
                1 for issue in bucket_issues if issue.status == IssueStatus.PUBLISHED
            )
            top_category = Counter(issue.category.slug for issue in bucket_issues).most_common(1)
            intensity = round(
                clamp(
                    (issue_count / 6) * 0.45
                    + (average_impact / 10) * 0.4
                    + (duplicate_count / 4) * 0.15,
                    minimum=0.05,
                    maximum=1.0,
                ),
                3,
            )
            points.append(
                AdminHeatPointRead(
                    area_key=area_key,
                    label=f"{latitude:.3f}, {longitude:.3f}",
                    latitude=latitude,
                    longitude=longitude,
                    intensity=intensity,
                    issue_count=issue_count,
                    trust_weighted_activity=trust_weighted_activity,
                    duplicate_count=duplicate_count,
                    needs_review_count=needs_review_count,
                    published_count=published_count,
                    top_category_slug=top_category[0][0] if top_category else None,
                    average_impact_score=average_impact,
                )
            )
        return points

    @staticmethod
    def _area_key(latitude: float, longitude: float) -> str:
        return f"{round(latitude / 0.025) * 0.025:.3f}:{round(longitude / 0.025) * 0.025:.3f}"

    @staticmethod
    def _bucket_start(value: datetime, granularity: str) -> datetime:
        if granularity == "month":
            return datetime(value.year, value.month, 1, tzinfo=UTC)
        if granularity == "week":
            monday = value.date() - timedelta(days=value.weekday())
            return datetime.combine(monday, datetime.min.time(), tzinfo=UTC)
        return datetime(value.year, value.month, value.day, tzinfo=UTC)

    def _cutoff_for_granularity(self, granularity: str, periods: int) -> datetime:
        now = datetime.now(UTC)
        if granularity == "month":
            return now - timedelta(days=max(periods, 1) * 31)
        if granularity == "week":
            return now - timedelta(days=max(periods, 1) * 7)
        return now - timedelta(days=max(periods, 1))

    def _empty_buckets(self, granularity: str, periods: int) -> dict[datetime, dict[str, int]]:
        now = datetime.now(UTC)
        keys: list[datetime] = []
        for index in range(periods):
            if granularity == "month":
                candidate = now - timedelta(days=(periods - index - 1) * 31)
            elif granularity == "week":
                candidate = now - timedelta(days=(periods - index - 1) * 7)
            else:
                candidate = now - timedelta(days=periods - index - 1)
            keys.append(self._bucket_start(candidate, granularity))
        return {
            key: {
                "issues": 0,
                "support": 0,
                "tickets": 0,
                "skip": 0,
                "more_like_this": 0,
                "less_like_this": 0,
            }
            for key in keys
        }

    @staticmethod
    def _format_bucket_label(value: datetime, granularity: str) -> str:
        if granularity == "month":
            return value.strftime("%b %Y")
        if granularity == "week":
            week_end = value + timedelta(days=6)
            return f"{value.strftime('%b %d')} - {week_end.strftime('%b %d')}"
        return value.strftime("%b %d")


def _ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)
