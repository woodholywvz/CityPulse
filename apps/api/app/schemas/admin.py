from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import (
    DuplicateResolutionStatus,
    IssueStatus,
    ModerationState,
    SupportTicketStatus,
    SupportTicketType,
    SwipeDirection,
)
from app.schemas.issue import (
    AdminModerationIssueRead,
    IssueAttachmentRead,
    IssueCategoryRead,
    IssueImpactAdminRead,
    IssueModerationAdminRead,
)
from app.schemas.user import (
    AdminUserIdentityRead,
    IntegrityEventRead,
    IntegrityFactorRead,
    UserIntegrityCompactRead,
)

AnalyticsGranularity = Literal["day", "week", "month"]
AdminIssueAction = Literal["approve", "reject", "publish", "archive", "reopen"]


class AdminDistributionItemRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    key: str
    label: str
    count: int
    share: float
    numeric_value: float | None = None


class AdminActivityTrendPointRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    bucket_start: datetime
    label: str
    issue_submissions: int
    support_actions: int
    tickets_created: int


class AdminSupportTrendPointRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    bucket_start: datetime
    label: str
    support: int
    skip: int
    more_like_this: int
    less_like_this: int


class AdminImpactDistributionBucketRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    range_key: str
    min_score: float
    max_score: float
    count: int


class AdminHeatPointRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    area_key: str
    label: str
    latitude: float
    longitude: float
    intensity: float
    issue_count: int
    trust_weighted_activity: float
    duplicate_count: int
    needs_review_count: int
    published_count: int
    top_category_slug: str | None = None
    average_impact_score: float | None = None


class PublicHeatPointRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    area_key: str
    label: str
    latitude: float
    longitude: float
    intensity: float
    issue_count: int
    top_category_slug: str | None = None


class AdminTopAreaRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    area_key: str
    label: str
    issue_count: int
    total_impact_score: float
    average_impact_score: float
    latitude: float
    longitude: float
    dominant_category_slug: str | None = None


class AdminIssueSummaryRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    title: str
    short_description: str
    status: IssueStatus
    moderation_state: ModerationState
    category: IssueCategoryRead
    author: UserIntegrityCompactRead | None = None
    location_snippet: str
    support_count: int
    trust_weighted_support_total: float
    duplicate_count: int
    public_impact_score: float | None = None
    affected_people_estimate: int | None = None
    created_at: datetime
    updated_at: datetime


class AdminDashboardIssueVolumeRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    total_issues: int
    new_last_7_days: int
    published_count: int
    pending_count: int
    archived_count: int


class AdminDashboardModerationRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    approved_count: int
    rejected_count: int
    needs_review_count: int
    queued_count: int


class AdminDashboardTrustRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    average_trust_score: float
    high_abuse_risk_users: int
    medium_abuse_risk_users: int
    banned_users: int
    sanctioned_users: int


class AdminDashboardTicketQueueRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    open_count: int
    under_review_count: int
    waiting_for_user_count: int
    resolved_count: int
    appeal_count: int
    bug_report_count: int
    improvement_count: int


class AdminDashboardReactionRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    support_count: int
    skip_count: int
    more_like_this_count: int
    less_like_this_count: int


class AdminTicketListItemRead(BaseModel):
    model_config = ConfigDict(frozen=True, populate_by_name=True)

    id: UUID
    issue_id: UUID | None = None
    author: AdminUserIdentityRead
    ticket_type: SupportTicketType = Field(serialization_alias="type")
    status: SupportTicketStatus
    subject: str
    message_count: int
    latest_message_preview: str | None = None
    latest_message_at: datetime | None = None
    issue_title: str | None = None
    created_at: datetime
    updated_at: datetime


class AdminDashboardRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    issue_volume: AdminDashboardIssueVolumeRead
    moderation_overview: AdminDashboardModerationRead
    impact_distribution: list[AdminImpactDistributionBucketRead]
    top_priority_issues: list[AdminIssueSummaryRead]
    trust_overview: AdminDashboardTrustRead
    ticket_queue: AdminDashboardTicketQueueRead
    reaction_overview: AdminDashboardReactionRead
    activity_trends: list[AdminActivityTrendPointRead]
    recent_tickets: list[AdminTicketListItemRead]
    recent_moderation: list[AdminModerationIssueRead]
    heatmap_preview: list[AdminHeatPointRead]


class AdminDuplicateLinkRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    status: DuplicateResolutionStatus
    canonical_issue_id: UUID
    duplicate_issue_id: UUID | None = None
    canonical_issue_title: str | None = None
    duplicate_issue_title: str | None = None
    similarity_score: float | None = None
    distance_km: float | None = None
    text_similarity: float | None = None
    category_match: bool
    reason_breakdown: list[str] = Field(default_factory=list)
    created_at: datetime


class AdminIssueSupportMetricsRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    support_count: int
    trust_weighted_support_total: float
    skip_count: int
    more_like_this_count: int
    less_like_this_count: int


class AdminActionLogRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    action: str
    entity_type: str
    entity_id: UUID | None = None
    note: str | None = None
    payload: dict[str, object] = Field(default_factory=dict)
    created_at: datetime
    admin: AdminUserIdentityRead | None = None


class AdminIssueDetailRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    issue: AdminIssueSummaryRead
    attachments: list[IssueAttachmentRead]
    moderation_results: list[IssueModerationAdminRead]
    impact: IssueImpactAdminRead
    support_metrics: AdminIssueSupportMetricsRead
    canonical_duplicates: list[AdminDuplicateLinkRead] = Field(default_factory=list)
    duplicate_of: list[AdminDuplicateLinkRead] = Field(default_factory=list)
    admin_actions: list[AdminActionLogRead] = Field(default_factory=list)


class AdminIssueActionRequest(BaseModel):
    action: AdminIssueAction
    note: str | None = Field(default=None, max_length=1000)
    bypass_ai: bool = False


class AdminIssueDuplicateLinkRequest(BaseModel):
    canonical_issue_id: UUID
    note: str | None = Field(default=None, max_length=1000)
    archive_duplicate: bool = False
    similarity_score: float | None = Field(default=None, ge=0, le=1)
    distance_km: float | None = Field(default=None, ge=0)
    text_similarity: float | None = Field(default=None, ge=0, le=1)
    category_match: bool = False
    reason_breakdown: list[str] = Field(default_factory=list)


class AdminTicketMessageRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    ticket_id: UUID
    author_id: UUID
    author_name: str
    author_role: str
    body: str
    is_internal: bool
    created_at: datetime
    updated_at: datetime


class AdminTicketDetailRead(BaseModel):
    model_config = ConfigDict(frozen=True, populate_by_name=True)

    id: UUID
    issue_id: UUID | None = None
    author: AdminUserIdentityRead
    ticket_type: SupportTicketType = Field(serialization_alias="type")
    status: SupportTicketStatus
    subject: str
    issue_title: str | None = None
    issue_status: IssueStatus | None = None
    latest_moderation_code: str | None = None
    messages: list[AdminTicketMessageRead]
    created_at: datetime
    updated_at: datetime


class AdminTicketReplyCreate(BaseModel):
    body: str = Field(min_length=2, max_length=4000)
    is_internal: bool = False
    status: SupportTicketStatus | None = None


class AdminTicketStatusUpdate(BaseModel):
    status: SupportTicketStatus
    note: str | None = Field(default=None, max_length=1000)


class AdminUserIssueHistoryRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    title: str
    status: IssueStatus
    moderation_state: ModerationState
    public_impact_score: float | None = None
    created_at: datetime


class AdminUserTicketHistoryRead(BaseModel):
    model_config = ConfigDict(frozen=True, populate_by_name=True)

    id: UUID
    subject: str
    ticket_type: SupportTicketType = Field(serialization_alias="type")
    status: SupportTicketStatus
    issue_id: UUID | None = None
    created_at: datetime


class AdminUserModerationHistoryRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    issue_id: UUID
    issue_title: str
    layer: str
    status: str
    decision_code: str
    created_at: datetime


class AdminUserReactionPatternRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    action: SwipeDirection
    count: int


class AdminUserProfileRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    identity: AdminUserIdentityRead
    integrity: UserIntegrityCompactRead | None = None
    recent_events: list[IntegrityEventRead] = Field(default_factory=list)
    trust_factors: list[IntegrityFactorRead] = Field(default_factory=list)
    abuse_factors: list[IntegrityFactorRead] = Field(default_factory=list)
    recommended_actions: list[str] = Field(default_factory=list)
    metrics: dict[str, object] = Field(default_factory=dict)
    recent_issues: list[AdminUserIssueHistoryRead] = Field(default_factory=list)
    recent_tickets: list[AdminUserTicketHistoryRead] = Field(default_factory=list)
    moderation_history: list[AdminUserModerationHistoryRead] = Field(default_factory=list)
    reaction_patterns: list[AdminUserReactionPatternRead] = Field(default_factory=list)


class AdminUserModerationHistoryEnvelopeRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    user_id: UUID
    reactions_recorded: int
    low_signal_feedback_total: int
    support_total: int


class AdminUserActionRequest(BaseModel):
    note: str | None = Field(default=None, max_length=1000)
