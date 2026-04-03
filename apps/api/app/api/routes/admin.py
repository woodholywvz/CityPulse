from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import SessionDep, require_roles
from app.models import User
from app.models.enums import (
    IssueStatus,
    ModerationState,
    SupportTicketStatus,
    SupportTicketType,
    UserRole,
)
from app.schemas.admin import (
    AdminActivityTrendPointRead,
    AdminDashboardRead,
    AdminDistributionItemRead,
    AdminHeatPointRead,
    AdminIssueActionRequest,
    AdminIssueDetailRead,
    AdminIssueDuplicateLinkRequest,
    AdminIssueSummaryRead,
    AdminSupportTrendPointRead,
    AdminTicketDetailRead,
    AdminTicketListItemRead,
    AdminTicketReplyCreate,
    AdminTicketStatusUpdate,
    AdminTopAreaRead,
    AdminUserActionRequest,
    AdminUserProfileRead,
    AnalyticsGranularity,
)
from app.schemas.issue import AdminModerationIssueRead, IssueModerationAuditRead
from app.schemas.user import UserIntegrityDetailRead, UserIntegritySummaryRead
from app.services.admin_analytics import AdminAnalyticsService, HeatmapFilters
from app.services.admin_integrity import AdminIntegrityService
from app.services.admin_issues import AdminIssueService
from app.services.admin_moderation import AdminModerationService
from app.services.admin_tickets import AdminTicketService
from app.services.admin_users import AdminUserService

router = APIRouter(prefix="/admin", tags=["admin"])
AdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN))]


@router.get("/dashboard", response_model=AdminDashboardRead)
async def get_admin_dashboard(
    admin_user: AdminUser,
    session: SessionDep,
) -> AdminDashboardRead:
    del admin_user
    return await AdminAnalyticsService(session).get_dashboard()


@router.get("/moderation/issues", response_model=list[AdminModerationIssueRead])
async def list_recent_moderation_issues(
    admin_user: AdminUser,
    session: SessionDep,
    limit: int = 30,
) -> list[AdminModerationIssueRead]:
    del admin_user
    return await AdminModerationService(session).list_recent_issues(limit=min(limit, 60))


@router.get("/moderation/issues/{issue_id}", response_model=IssueModerationAuditRead)
async def get_moderation_issue_detail(
    issue_id: UUID,
    admin_user: AdminUser,
    session: SessionDep,
) -> IssueModerationAuditRead:
    del admin_user
    return await AdminModerationService(session).get_issue_detail(issue_id)


@router.post("/moderation/issues/{issue_id}/rerun", response_model=IssueModerationAuditRead)
async def rerun_issue_moderation(
    issue_id: UUID,
    admin_user: AdminUser,
    session: SessionDep,
) -> IssueModerationAuditRead:
    del admin_user
    return await AdminModerationService(session).rerun_issue(issue_id)


@router.get("/issues", response_model=list[AdminIssueSummaryRead])
async def list_admin_issues(
    admin_user: AdminUser,
    session: SessionDep,
    limit: int = 40,
    status: IssueStatus | None = None,
    moderation_state: ModerationState | None = None,
    category_id: UUID | None = None,
    author_id: UUID | None = None,
) -> list[AdminIssueSummaryRead]:
    del admin_user
    return await AdminIssueService(session).list_issues(
        limit=min(limit, 80),
        status=status,
        moderation_state=moderation_state,
        category_id=category_id,
        author_id=author_id,
    )


@router.get("/issues/{issue_id}", response_model=AdminIssueDetailRead)
async def get_admin_issue_detail(
    issue_id: UUID,
    admin_user: AdminUser,
    session: SessionDep,
) -> AdminIssueDetailRead:
    del admin_user
    return await AdminIssueService(session).get_issue_detail(issue_id)


@router.post("/issues/{issue_id}/actions", response_model=AdminIssueDetailRead)
async def apply_admin_issue_action(
    issue_id: UUID,
    payload: AdminIssueActionRequest,
    admin_user: AdminUser,
    session: SessionDep,
) -> AdminIssueDetailRead:
    return await AdminIssueService(session).apply_action(
        issue_id=issue_id,
        admin=admin_user,
        payload=payload,
    )


@router.post("/issues/{issue_id}/duplicates/link", response_model=AdminIssueDetailRead)
async def link_admin_issue_duplicate(
    issue_id: UUID,
    payload: AdminIssueDuplicateLinkRequest,
    admin_user: AdminUser,
    session: SessionDep,
) -> AdminIssueDetailRead:
    return await AdminIssueService(session).link_duplicate(
        issue_id=issue_id,
        admin=admin_user,
        payload=payload,
    )


@router.get("/tickets", response_model=list[AdminTicketListItemRead])
async def list_admin_tickets(
    admin_user: AdminUser,
    session: SessionDep,
    limit: int = 40,
    status: SupportTicketStatus | None = None,
    ticket_type: SupportTicketType | None = None,
) -> list[AdminTicketListItemRead]:
    del admin_user
    return await AdminTicketService(session).list_tickets(
        limit=min(limit, 80),
        status=status.value if status is not None else None,
        ticket_type=ticket_type.value if ticket_type is not None else None,
    )


@router.get("/tickets/{ticket_id}", response_model=AdminTicketDetailRead)
async def get_admin_ticket_detail(
    ticket_id: UUID,
    admin_user: AdminUser,
    session: SessionDep,
) -> AdminTicketDetailRead:
    del admin_user
    return await AdminTicketService(session).get_ticket_detail(ticket_id)


@router.post("/tickets/{ticket_id}/reply", response_model=AdminTicketDetailRead)
async def reply_admin_ticket(
    ticket_id: UUID,
    payload: AdminTicketReplyCreate,
    admin_user: AdminUser,
    session: SessionDep,
) -> AdminTicketDetailRead:
    return await AdminTicketService(session).reply_to_ticket(
        ticket_id=ticket_id,
        admin=admin_user,
        payload=payload,
    )


@router.post("/tickets/{ticket_id}/status", response_model=AdminTicketDetailRead)
async def update_admin_ticket_status(
    ticket_id: UUID,
    payload: AdminTicketStatusUpdate,
    admin_user: AdminUser,
    session: SessionDep,
) -> AdminTicketDetailRead:
    return await AdminTicketService(session).update_ticket_status(
        ticket_id=ticket_id,
        admin=admin_user,
        payload=payload,
    )


@router.get("/users", response_model=list[UserIntegritySummaryRead])
async def list_integrity_users(
    admin_user: AdminUser,
    session: SessionDep,
    limit: int = 40,
) -> list[UserIntegritySummaryRead]:
    del admin_user
    return await AdminIntegrityService(session).list_users(limit=min(limit, 80))


@router.get("/users/{user_id}", response_model=AdminUserProfileRead)
async def get_admin_user_profile(
    user_id: UUID,
    admin_user: AdminUser,
    session: SessionDep,
) -> AdminUserProfileRead:
    del admin_user
    return await AdminUserService(session).get_user_profile(user_id)


@router.get("/users/{user_id}/integrity", response_model=UserIntegrityDetailRead)
async def get_user_integrity_detail(
    user_id: UUID,
    admin_user: AdminUser,
    session: SessionDep,
) -> UserIntegrityDetailRead:
    del admin_user
    return await AdminIntegrityService(session).get_user_detail(user_id)


@router.post("/users/{user_id}/integrity/recalculate", response_model=UserIntegrityDetailRead)
async def recalculate_user_integrity(
    user_id: UUID,
    admin_user: AdminUser,
    session: SessionDep,
) -> UserIntegrityDetailRead:
    del admin_user
    return await AdminIntegrityService(session).recalculate_user(user_id)


@router.post("/users/{user_id}/ban", response_model=AdminUserProfileRead)
async def ban_user(
    user_id: UUID,
    payload: AdminUserActionRequest,
    admin_user: AdminUser,
    session: SessionDep,
) -> AdminUserProfileRead:
    return await AdminUserService(session).set_user_active(
        user_id=user_id,
        admin=admin_user,
        active=False,
        payload=payload,
    )


@router.post("/users/{user_id}/unban", response_model=AdminUserProfileRead)
async def unban_user(
    user_id: UUID,
    payload: AdminUserActionRequest,
    admin_user: AdminUser,
    session: SessionDep,
) -> AdminUserProfileRead:
    return await AdminUserService(session).set_user_active(
        user_id=user_id,
        admin=admin_user,
        active=True,
        payload=payload,
    )


@router.get("/analytics/trends", response_model=list[AdminActivityTrendPointRead])
async def get_admin_activity_trends(
    admin_user: AdminUser,
    session: SessionDep,
    granularity: AnalyticsGranularity = "day",
    periods: int = 30,
) -> list[AdminActivityTrendPointRead]:
    del admin_user
    return await AdminAnalyticsService(session).get_activity_trends(
        granularity=granularity,
        periods=min(max(periods, 4), 52),
    )


@router.get("/analytics/category-distribution", response_model=list[AdminDistributionItemRead])
async def get_admin_category_distribution(
    admin_user: AdminUser,
    session: SessionDep,
) -> list[AdminDistributionItemRead]:
    del admin_user
    return await AdminAnalyticsService(session).get_category_distribution()


@router.get("/analytics/moderation-outcomes", response_model=list[AdminDistributionItemRead])
async def get_admin_moderation_outcomes(
    admin_user: AdminUser,
    session: SessionDep,
) -> list[AdminDistributionItemRead]:
    del admin_user
    return await AdminAnalyticsService(session).get_moderation_outcomes()


@router.get("/analytics/trust-distribution", response_model=list[AdminDistributionItemRead])
async def get_admin_trust_distribution(
    admin_user: AdminUser,
    session: SessionDep,
) -> list[AdminDistributionItemRead]:
    del admin_user
    return await AdminAnalyticsService(session).get_trust_distribution()


@router.get("/analytics/abuse-incidents", response_model=list[AdminDistributionItemRead])
async def get_admin_abuse_incidents(
    admin_user: AdminUser,
    session: SessionDep,
    days: int = 90,
) -> list[AdminDistributionItemRead]:
    del admin_user
    return await AdminAnalyticsService(session).get_abuse_incidents(days=min(max(days, 7), 365))


@router.get("/analytics/support-trends", response_model=list[AdminSupportTrendPointRead])
async def get_admin_support_trends(
    admin_user: AdminUser,
    session: SessionDep,
    granularity: AnalyticsGranularity = "day",
    periods: int = 30,
) -> list[AdminSupportTrendPointRead]:
    del admin_user
    return await AdminAnalyticsService(session).get_support_trends(
        granularity=granularity,
        periods=min(max(periods, 4), 52),
    )


@router.get("/analytics/top-areas", response_model=list[AdminTopAreaRead])
async def get_admin_top_areas(
    admin_user: AdminUser,
    session: SessionDep,
    limit: int = 12,
) -> list[AdminTopAreaRead]:
    del admin_user
    return await AdminAnalyticsService(session).get_top_areas(limit=min(limit, 24))


@router.get("/analytics/duplicate-concentration", response_model=list[AdminDistributionItemRead])
async def get_admin_duplicate_concentration(
    admin_user: AdminUser,
    session: SessionDep,
    limit: int = 12,
) -> list[AdminDistributionItemRead]:
    del admin_user
    return await AdminAnalyticsService(session).get_duplicate_concentration(limit=min(limit, 24))


@router.get("/analytics/heatmap", response_model=list[AdminHeatPointRead])
async def get_admin_heatmap(
    admin_user: AdminUser,
    session: SessionDep,
    category_id: UUID | None = None,
    status: IssueStatus | None = None,
    moderation_state: ModerationState | None = None,
    days: int = 120,
    minimum_public_score: float = 0.0,
    limit: int = 200,
) -> list[AdminHeatPointRead]:
    del admin_user
    return await AdminAnalyticsService(session).get_admin_heatmap(
        limit=min(limit, 300),
        filters=HeatmapFilters(
            category_id=category_id,
            status=status,
            moderation_state=moderation_state,
            days=min(max(days, 14), 365),
            minimum_public_score=minimum_public_score,
        ),
    )
