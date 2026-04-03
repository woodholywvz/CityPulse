from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import IssueStatus, ModerationState, SwipeDirection


class IssueCategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    display_name: str
    description: str | None
    is_active: bool


class IssueAttachmentCreate(BaseModel):
    original_filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=3, max_length=120)
    size_bytes: int = Field(gt=0)
    storage_key: str = Field(min_length=3, max_length=255)


class IssueAttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    issue_id: UUID
    uploader_id: UUID
    storage_key: str
    original_filename: str
    content_type: str
    size_bytes: int
    created_at: datetime
    updated_at: datetime


class IssueCreate(BaseModel):
    title: str = Field(min_length=4, max_length=160)
    short_description: str = Field(min_length=10, max_length=4000)
    category_id: UUID
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    source_locale: str = Field(default="en", min_length=2, max_length=12)


class IssueRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_id: UUID
    title: str
    short_description: str
    latitude: float
    longitude: float
    status: IssueStatus
    moderation_state: ModerationState
    source_locale: str
    category: IssueCategoryRead
    attachments: list[IssueAttachmentRead]
    support_count: int = 0
    location_snippet: str = ""
    created_at: datetime
    updated_at: datetime


class PublicIssueSort(str):
    TOP = "top"
    RECENT = "recent"
    NEARBY = "nearby"


class PublicIssueSummaryRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    title: str
    short_description: str
    latitude: float
    longitude: float
    category: IssueCategoryRead
    location_snippet: str
    support_count: int
    importance_label: str | None = None
    cover_image_url: str | None = None
    created_at: datetime
    updated_at: datetime
    distance_km: float | None = None


class PublicIssueDetailRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    title: str
    short_description: str
    latitude: float
    longitude: float
    category: IssueCategoryRead
    location_snippet: str
    support_count: int
    importance_label: str | None = None
    cover_image_url: str | None = None
    source_locale: str
    attachments: list[IssueAttachmentRead]
    created_at: datetime
    updated_at: datetime


class PublicIssueMapMarkerRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: UUID
    title: str
    latitude: float
    longitude: float
    category: IssueCategoryRead
    location_snippet: str
    support_count: int
    importance_label: str | None = None


class IssueDuplicateSuggestionRequest(BaseModel):
    title: str = Field(min_length=4, max_length=160)
    short_description: str = Field(min_length=10, max_length=4000)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    category_id: UUID | None = None


class IssueDuplicateSuggestionRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    issue: PublicIssueSummaryRead
    similarity_score: float
    distance_km: float
    reason: str


class IssueDuplicateSuggestionResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    matches: list[IssueDuplicateSuggestionRead]


class IssueRewriteRequest(BaseModel):
    title: str = Field(min_length=4, max_length=160)
    short_description: str = Field(min_length=10, max_length=4000)


class IssueRewriteResponse(BaseModel):
    model_config = ConfigDict(frozen=True)

    rewritten_title: str
    rewritten_description: str
    note: str


class IssueFeedbackCreate(BaseModel):
    action: SwipeDirection


class IssueFeedbackRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    issue_id: UUID
    action: SwipeDirection
    support_count: int
