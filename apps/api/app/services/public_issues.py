from __future__ import annotations

import math
import re
from collections.abc import Iterable
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.exceptions import NotFoundError
from app.models import Issue, IssueCategory, SwipeFeedback
from app.models.enums import IssueStatus, SwipeDirection
from app.schemas.issue import (
    IssueCategoryRead,
    IssueDuplicateSuggestionRead,
    IssueDuplicateSuggestionRequest,
    IssueDuplicateSuggestionResponse,
    IssueFeedbackRead,
    IssueRewriteRequest,
    IssueRewriteResponse,
    PublicIssueDetailRead,
    PublicIssueMapMarkerRead,
    PublicIssueSummaryRead,
)

TOKEN_PATTERN = re.compile(r"[a-z0-9]+")


@dataclass(slots=True)
class PublicIssueQuery:
    sort: str = "recent"
    category_id: UUID | None = None
    latitude: float | None = None
    longitude: float | None = None
    limit: int = 24
    exclude_issue_ids: tuple[UUID, ...] = ()


class PublicIssueService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.settings = get_settings()

    async def list_categories(self) -> list[IssueCategoryRead]:
        categories = await self.session.scalars(
            select(IssueCategory)
            .where(IssueCategory.is_active.is_(True))
            .order_by(IssueCategory.display_name.asc())
        )
        return [
            IssueCategoryRead.model_validate(category)
            for category in categories.all()
        ]

    async def list_public_issues(
        self,
        query: PublicIssueQuery,
    ) -> list[PublicIssueSummaryRead]:
        issues = await self._load_public_issues(query)
        support_counts = await self._get_support_counts(issue.id for issue in issues)
        sorted_issues = self._sort_issues(issues, support_counts, query)

        return [
            self._to_public_summary(issue, support_counts.get(issue.id, 0), query)
            for issue in sorted_issues[: query.limit]
        ]

    async def list_public_map_markers(
        self,
        query: PublicIssueQuery,
    ) -> list[PublicIssueMapMarkerRead]:
        issues = await self._load_public_issues(query)
        support_counts = await self._get_support_counts(issue.id for issue in issues)
        sorted_issues = self._sort_issues(issues, support_counts, query)
        markers: list[PublicIssueMapMarkerRead] = []

        for issue in sorted_issues[: query.limit]:
            markers.append(
                PublicIssueMapMarkerRead(
                    id=issue.id,
                    title=issue.title,
                    latitude=issue.latitude,
                    longitude=issue.longitude,
                    category=IssueCategoryRead.model_validate(issue.category),
                    location_snippet=self._location_snippet(issue),
                    support_count=support_counts.get(issue.id, 0),
                    importance_label=self._importance_label(
                        support_counts.get(issue.id, 0)
                    ),
                )
            )

        return markers

    async def get_public_issue(self, issue_id: UUID) -> PublicIssueDetailRead:
        issue = await self.session.scalar(
            select(Issue)
            .where(Issue.id == issue_id, Issue.status == IssueStatus.PUBLISHED)
            .options(
                selectinload(Issue.category),
                selectinload(Issue.attachments),
            )
        )
        if issue is None:
            raise NotFoundError("Public issue was not found.")

        support_counts = await self._get_support_counts([issue.id])
        return self._to_public_detail(issue, support_counts.get(issue.id, 0))

    async def suggest_duplicates(
        self,
        payload: IssueDuplicateSuggestionRequest,
    ) -> IssueDuplicateSuggestionResponse:
        candidate_issues_result = await self.session.scalars(
            select(Issue)
            .where(Issue.status.in_(
                [
                    IssueStatus.PENDING_MODERATION,
                    IssueStatus.APPROVED,
                    IssueStatus.PUBLISHED,
                ]
            ))
            .options(
                selectinload(Issue.category),
                selectinload(Issue.attachments),
            )
            .order_by(Issue.created_at.desc())
            .limit(50)
        )
        candidate_issues = list(candidate_issues_result.all())

        candidate_tokens = self._tokenize(f"{payload.title} {payload.short_description}")
        support_counts = await self._get_support_counts(
            issue.id for issue in candidate_issues
        )
        matches: list[IssueDuplicateSuggestionRead] = []

        for issue in candidate_issues:
            issue_tokens = self._tokenize(f"{issue.title} {issue.short_description}")
            overlap_score = self._token_overlap_score(candidate_tokens, issue_tokens)
            distance_km = self._distance_km(
                payload.latitude,
                payload.longitude,
                issue.latitude,
                issue.longitude,
            )
            category_bonus = (
                0.2
                if payload.category_id is not None and issue.category_id == payload.category_id
                else 0.0
            )
            proximity_score = max(0.0, 1 - min(distance_km / 8, 1))
            similarity_score = round(
                min(overlap_score * 0.65 + proximity_score * 0.25 + category_bonus, 1.0),
                3,
            )

            if similarity_score < 0.34:
                continue

            reason_parts = []
            if overlap_score >= 0.45:
                reason_parts.append("Similar wording")
            if distance_km <= 1.2:
                reason_parts.append("nearby location")
            if category_bonus > 0:
                reason_parts.append("same category")

            matches.append(
                IssueDuplicateSuggestionRead(
                    issue=self._to_public_summary(issue, support_counts.get(issue.id, 0)),
                    similarity_score=similarity_score,
                    distance_km=round(distance_km, 2),
                    reason=", ".join(reason_parts) or "Potential duplicate",
                )
            )

        matches.sort(key=lambda match: match.similarity_score, reverse=True)
        return IssueDuplicateSuggestionResponse(matches=matches[:3])

    async def rewrite_issue_text(
        self,
        payload: IssueRewriteRequest,
    ) -> IssueRewriteResponse:
        normalized_title = self._normalize_text(payload.title, max_length=160)
        normalized_description = self._normalize_text(
            payload.short_description,
            max_length=4000,
        )

        rewritten_title = normalized_title[:1].upper() + normalized_title[1:]
        if not rewritten_title.endswith("."):
            rewritten_title = rewritten_title.rstrip(".") + "."

        rewritten_description = normalized_description
        if not rewritten_description.endswith("."):
            rewritten_description = f"{rewritten_description}."

        if "please" not in rewritten_description.lower():
            rewritten_description = (
                f"{rewritten_description} Please review this location when possible."
            )

        return IssueRewriteResponse(
            rewritten_title=rewritten_title,
            rewritten_description=rewritten_description,
            note=(
                "This assistive rewrite keeps the issue content intact while reducing heat "
                "and clarifying the request."
            ),
        )

    async def record_feedback(
        self,
        *,
        issue_id: UUID,
        user_id: UUID,
        action: SwipeDirection,
    ) -> IssueFeedbackRead:
        issue = await self.session.scalar(
            select(Issue).where(
                Issue.id == issue_id,
                Issue.status == IssueStatus.PUBLISHED,
            )
        )
        if issue is None:
            raise NotFoundError("Public issue was not found.")

        feedback = await self.session.scalar(
            select(SwipeFeedback).where(
                SwipeFeedback.user_id == user_id,
                SwipeFeedback.issue_id == issue_id,
            )
        )

        if feedback is None:
            feedback = SwipeFeedback(
                user_id=user_id,
                issue_id=issue_id,
                direction=action,
            )
            self.session.add(feedback)
        else:
            feedback.direction = action

        await self.session.commit()

        support_counts = await self._get_support_counts([issue_id])
        return IssueFeedbackRead(
            issue_id=issue_id,
            action=action,
            support_count=support_counts.get(issue_id, 0),
        )

    async def _load_public_issues(self, query: PublicIssueQuery) -> list[Issue]:
        statement = (
            select(Issue)
            .where(Issue.status == IssueStatus.PUBLISHED)
            .options(
                selectinload(Issue.category),
                selectinload(Issue.attachments),
            )
        )

        if query.category_id is not None:
            statement = statement.where(Issue.category_id == query.category_id)

        if query.exclude_issue_ids:
            statement = statement.where(Issue.id.not_in(query.exclude_issue_ids))

        issues = await self.session.scalars(statement)
        return list(issues.all())

    async def _get_support_counts(
        self,
        issue_ids: Iterable[UUID],
    ) -> dict[UUID, int]:
        ids = tuple(issue_ids)
        if not ids:
            return {}

        rows = await self.session.execute(
            select(SwipeFeedback.issue_id, func.count(SwipeFeedback.id))
            .where(
                SwipeFeedback.issue_id.in_(ids),
                SwipeFeedback.direction == SwipeDirection.SUPPORT,
            )
            .group_by(SwipeFeedback.issue_id)
        )
        return {issue_id: count for issue_id, count in rows.all()}

    def _sort_issues(
        self,
        issues: list[Issue],
        support_counts: dict[UUID, int],
        query: PublicIssueQuery,
    ) -> list[Issue]:
        if query.sort == "top":
            return sorted(
                issues,
                key=lambda issue: (
                    support_counts.get(issue.id, 0),
                    issue.created_at,
                ),
                reverse=True,
            )

        if query.sort == "nearby" and query.latitude is not None and query.longitude is not None:
            return sorted(
                issues,
                key=lambda issue: self._distance_km(
                    query.latitude,
                    query.longitude,
                    issue.latitude,
                    issue.longitude,
                ),
            )

        return sorted(issues, key=lambda issue: issue.created_at, reverse=True)

    def _to_public_summary(
        self,
        issue: Issue,
        support_count: int,
        query: PublicIssueQuery | None = None,
    ) -> PublicIssueSummaryRead:
        distance_km = None
        if query is not None and query.latitude is not None and query.longitude is not None:
            distance_km = round(
                self._distance_km(
                    query.latitude,
                    query.longitude,
                    issue.latitude,
                    issue.longitude,
                ),
                2,
            )

        return PublicIssueSummaryRead(
            id=issue.id,
            title=issue.title,
            short_description=issue.short_description,
            latitude=issue.latitude,
            longitude=issue.longitude,
            category=IssueCategoryRead.model_validate(issue.category),
            location_snippet=self._location_snippet(issue),
            support_count=support_count,
            importance_label=self._importance_label(support_count),
            cover_image_url=self._cover_image_url(issue),
            created_at=issue.created_at,
            updated_at=issue.updated_at,
            distance_km=distance_km,
        )

    def _to_public_detail(
        self,
        issue: Issue,
        support_count: int,
    ) -> PublicIssueDetailRead:
        return PublicIssueDetailRead(
            id=issue.id,
            title=issue.title,
            short_description=issue.short_description,
            latitude=issue.latitude,
            longitude=issue.longitude,
            category=IssueCategoryRead.model_validate(issue.category),
            location_snippet=self._location_snippet(issue),
            support_count=support_count,
            importance_label=self._importance_label(support_count),
            cover_image_url=self._cover_image_url(issue),
            source_locale=issue.source_locale,
            attachments=[
                attachment for attachment in issue.attachments
            ],
            created_at=issue.created_at,
            updated_at=issue.updated_at,
        )

    def _cover_image_url(self, issue: Issue) -> str | None:
        if not issue.attachments:
            return None

        first_attachment = issue.attachments[0]
        if not self.settings.s3_endpoint_url:
            return None

        endpoint = self.settings.s3_endpoint_url.rstrip("/")
        return f"{endpoint}/{self.settings.s3_bucket}/{first_attachment.storage_key}"

    @staticmethod
    def _location_snippet(issue: Issue) -> str:
        return f"{issue.latitude:.3f}, {issue.longitude:.3f}"

    @staticmethod
    def _importance_label(support_count: int) -> str | None:
        if support_count >= 12:
            return "High community support"
        if support_count >= 5:
            return "Building traction"
        return None

    @staticmethod
    def _tokenize(value: str) -> set[str]:
        return set(TOKEN_PATTERN.findall(value.lower()))

    @staticmethod
    def _token_overlap_score(left: set[str], right: set[str]) -> float:
        if not left or not right:
            return 0.0
        overlap = left & right
        union = left | right
        return len(overlap) / len(union)

    @staticmethod
    def _distance_km(
        lat_a: float,
        lon_a: float,
        lat_b: float,
        lon_b: float,
    ) -> float:
        radius_km = 6371.0
        lat_a_rad = math.radians(lat_a)
        lat_b_rad = math.radians(lat_b)
        delta_lat = math.radians(lat_b - lat_a)
        delta_lon = math.radians(lon_b - lon_a)

        haversine = (
            math.sin(delta_lat / 2) ** 2
            + math.cos(lat_a_rad)
            * math.cos(lat_b_rad)
            * math.sin(delta_lon / 2) ** 2
        )
        return radius_km * 2 * math.atan2(math.sqrt(haversine), math.sqrt(1 - haversine))

    @staticmethod
    def _normalize_text(value: str, *, max_length: int) -> str:
        normalized = re.sub(r"\s+", " ", value).strip()
        normalized = re.sub(r"([!?.,])\1+", r"\1", normalized)
        normalized = normalized[:max_length].strip()
        if normalized.isupper():
            normalized = normalized.title()
        return normalized
