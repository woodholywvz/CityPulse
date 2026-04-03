import { siteConfig } from "@/lib/site";
import type {
  AdminActivityTrendPoint,
  AdminDashboard,
  AdminDistributionItem,
  AdminHeatPoint,
  AdminIssueActionInput,
  AdminIssueDetail,
  AdminIssueDuplicateLinkInput,
  AdminIssueSummary,
  AdminSupportTrendPoint,
  AdminTicketDetail,
  AdminTicketListItem,
  AdminTicketReplyInput,
  AdminTicketStatusInput,
  AdminTopArea,
  AdminUserActionInput,
  AdminUserProfile,
  AdminModerationIssue,
  UserIntegrityDetail,
  UserIntegritySummary,
  AnalyticsGranularity,
  ApiErrorPayload,
  AuthTokenResponse,
  DuplicateSuggestionResponse,
  Issue,
  IssueAttachment,
  IssueCategory,
  IssueFeedbackResponse,
  IssueImpactAdmin,
  IssueModerationAudit,
  IssuePublicImpact,
  PublicIssueDetail,
  PublicHeatPoint,
  PublicIssueMapMarker,
  PublicIssueSort,
  PublicIssueSummary,
  RewriteResponse,
  SupportExistingIssueInput,
  SupportExistingIssueResponse,
  SupportTicket,
  SwipeAction,
  User,
} from "@/lib/api/types";

type RequestOptions = RequestInit & {
  token?: string | null;
};

export class ApiError extends Error {
  status: number;
  code: string | undefined;
  details: unknown;

  constructor(
    message: string,
    {
      status,
      code,
      details,
    }: {
      status: number;
      code?: string;
      details?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function buildUrl(path: string, searchParams?: URLSearchParams) {
  const url = new URL(path, siteConfig.apiBaseUrl);
  if (searchParams) {
    url.search = searchParams.toString();
  }
  return url.toString();
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  searchParams?: URLSearchParams,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(buildUrl(path, searchParams), {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;

    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }

    throw new ApiError(payload?.error.message ?? "Request failed.", {
      status: response.status,
      code: payload?.error.code,
      details: payload?.error.details,
    });
  }

  return (await response.json()) as T;
}

export const apiClient = {
  async register(input: {
    email: string;
    password: string;
    full_name: string;
    preferred_locale: string;
  }) {
    return request<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async login(input: { email: string; password: string }) {
    return request<AuthTokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getCurrentUser(token: string) {
    return request<User>("/api/users/me", { token });
  },

  async listCategories() {
    return request<IssueCategory[]>("/api/public/categories");
  },

  async listPublicIssues(input: {
    sort?: PublicIssueSort;
    categoryId?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (input.sort) params.set("sort", input.sort);
    if (input.categoryId) params.set("category_id", input.categoryId);
    if (typeof input.latitude === "number") params.set("latitude", String(input.latitude));
    if (typeof input.longitude === "number") params.set("longitude", String(input.longitude));
    if (input.limit) params.set("limit", String(input.limit));

    return request<PublicIssueSummary[]>("/api/public/issues", {}, params);
  },

  async listSwipeFeed(input: {
    sort?: PublicIssueSort;
    categoryId?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    limit?: number;
    excludeIssueIds?: string[];
  }) {
    const params = new URLSearchParams();
    if (input.sort) params.set("sort", input.sort);
    if (input.categoryId) params.set("category_id", input.categoryId);
    if (typeof input.latitude === "number") params.set("latitude", String(input.latitude));
    if (typeof input.longitude === "number") params.set("longitude", String(input.longitude));
    if (input.limit) params.set("limit", String(input.limit));
    input.excludeIssueIds?.forEach((issueId) => params.append("exclude_issue_ids", issueId));

    return request<PublicIssueSummary[]>("/api/public/issues/feed", {}, params);
  },

  async listMapIssues(input: {
    categoryId?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (input.categoryId) params.set("category_id", input.categoryId);
    if (typeof input.latitude === "number") params.set("latitude", String(input.latitude));
    if (typeof input.longitude === "number") params.set("longitude", String(input.longitude));
    if (input.limit) params.set("limit", String(input.limit));

    return request<PublicIssueMapMarker[]>("/api/public/issues/map", {}, params);
  },

  async listPublicHeatmap(input: {
    categoryId?: string | null;
    days?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (input.categoryId) params.set("category_id", input.categoryId);
    if (input.days) params.set("days", String(input.days));
    if (input.limit) params.set("limit", String(input.limit));

    return request<PublicHeatPoint[]>("/api/public/issues/heatmap", {}, params);
  },

  async getPublicIssue(issueId: string) {
    return request<PublicIssueDetail>(`/api/public/issues/${issueId}`);
  },

  async getPublicIssueImpact(issueId: string) {
    return request<IssuePublicImpact>(`/api/public/issues/${issueId}/impact`);
  },

  async getIssueAdminImpact(token: string, issueId: string) {
    return request<IssueImpactAdmin>(`/api/issues/${issueId}/impact/admin`, {
      token,
    });
  },

  async submitIssue(
    token: string,
    input: {
      title: string;
      short_description: string;
      category_id: string;
      latitude: number;
      longitude: number;
      source_locale: string;
    },
  ) {
    return request<Issue>("/api/issues", {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },

  async getOwnIssue(token: string, issueId: string) {
    return request<Issue>(`/api/issues/${issueId}`, { token });
  },

  async createAttachmentMetadata(
    token: string,
    issueId: string,
    input: {
      original_filename: string;
      content_type: string;
      size_bytes: number;
      storage_key: string;
      moderation_image_url?: string | null;
    },
  ) {
    return request<IssueAttachment>(`/api/issues/${issueId}/attachments`, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },

  async listOwnIssues(token: string) {
    return request<Issue[]>("/api/issues/me", { token });
  },

  async listAdminModerationIssues(token: string, limit = 30) {
    const params = new URLSearchParams({ limit: String(limit) });
    return request<AdminModerationIssue[]>("/api/admin/moderation/issues", { token }, params);
  },

  async getAdminModerationIssue(token: string, issueId: string) {
    return request<IssueModerationAudit>(`/api/admin/moderation/issues/${issueId}`, {
      token,
    });
  },

  async rerunAdminModerationIssue(token: string, issueId: string) {
    return request<IssueModerationAudit>(
      `/api/admin/moderation/issues/${issueId}/rerun`,
      {
        method: "POST",
        token,
      },
    );
  },

  async listAdminUsers(token: string, limit = 40) {
    const params = new URLSearchParams({ limit: String(limit) });
    return request<UserIntegritySummary[]>("/api/admin/users", { token }, params);
  },

  async getAdminUserIntegrity(token: string, userId: string) {
    return request<UserIntegrityDetail>(`/api/admin/users/${userId}/integrity`, {
      token,
    });
  },

  async getAdminDashboard(token: string) {
    return request<AdminDashboard>("/api/admin/dashboard", { token });
  },

  async listAdminIssues(
    token: string,
    input: {
      limit?: number;
      status?: string | null;
      moderationState?: string | null;
      categoryId?: string | null;
      authorId?: string | null;
    } = {},
  ) {
    const params = new URLSearchParams();
    if (input.limit) params.set("limit", String(input.limit));
    if (input.status) params.set("status", input.status);
    if (input.moderationState) params.set("moderation_state", input.moderationState);
    if (input.categoryId) params.set("category_id", input.categoryId);
    if (input.authorId) params.set("author_id", input.authorId);

    return request<AdminIssueSummary[]>("/api/admin/issues", { token }, params);
  },

  async getAdminIssueDetail(token: string, issueId: string) {
    return request<AdminIssueDetail>(`/api/admin/issues/${issueId}`, { token });
  },

  async applyAdminIssueAction(
    token: string,
    issueId: string,
    input: AdminIssueActionInput,
  ) {
    return request<AdminIssueDetail>(`/api/admin/issues/${issueId}/actions`, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },

  async linkAdminIssueDuplicate(
    token: string,
    issueId: string,
    input: AdminIssueDuplicateLinkInput,
  ) {
    return request<AdminIssueDetail>(`/api/admin/issues/${issueId}/duplicates/link`, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },

  async listAdminTickets(
    token: string,
    input: {
      limit?: number;
      status?: string | null;
      ticketType?: string | null;
    } = {},
  ) {
    const params = new URLSearchParams();
    if (input.limit) params.set("limit", String(input.limit));
    if (input.status) params.set("status", input.status);
    if (input.ticketType) params.set("ticket_type", input.ticketType);

    return request<AdminTicketListItem[]>("/api/admin/tickets", { token }, params);
  },

  async getAdminTicketDetail(token: string, ticketId: string) {
    return request<AdminTicketDetail>(`/api/admin/tickets/${ticketId}`, { token });
  },

  async replyAdminTicket(
    token: string,
    ticketId: string,
    input: AdminTicketReplyInput,
  ) {
    return request<AdminTicketDetail>(`/api/admin/tickets/${ticketId}/reply`, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },

  async updateAdminTicketStatus(
    token: string,
    ticketId: string,
    input: AdminTicketStatusInput,
  ) {
    return request<AdminTicketDetail>(`/api/admin/tickets/${ticketId}/status`, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },

  async getAdminUserProfile(token: string, userId: string) {
    return request<AdminUserProfile>(`/api/admin/users/${userId}`, { token });
  },

  async banAdminUser(token: string, userId: string, input: AdminUserActionInput) {
    return request<AdminUserProfile>(`/api/admin/users/${userId}/ban`, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },

  async unbanAdminUser(token: string, userId: string, input: AdminUserActionInput) {
    return request<AdminUserProfile>(`/api/admin/users/${userId}/unban`, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },

  async getAdminActivityTrends(
    token: string,
    input: { granularity?: AnalyticsGranularity; periods?: number } = {},
  ) {
    const params = new URLSearchParams();
    if (input.granularity) params.set("granularity", input.granularity);
    if (input.periods) params.set("periods", String(input.periods));

    return request<AdminActivityTrendPoint[]>("/api/admin/analytics/trends", { token }, params);
  },

  async getAdminCategoryDistribution(token: string) {
    return request<AdminDistributionItem[]>("/api/admin/analytics/category-distribution", {
      token,
    });
  },

  async getAdminModerationOutcomes(token: string) {
    return request<AdminDistributionItem[]>("/api/admin/analytics/moderation-outcomes", {
      token,
    });
  },

  async getAdminTrustDistribution(token: string) {
    return request<AdminDistributionItem[]>("/api/admin/analytics/trust-distribution", {
      token,
    });
  },

  async getAdminAbuseIncidents(token: string, days = 90) {
    const params = new URLSearchParams({ days: String(days) });
    return request<AdminDistributionItem[]>("/api/admin/analytics/abuse-incidents", {
      token,
    }, params);
  },

  async getAdminSupportTrends(
    token: string,
    input: { granularity?: AnalyticsGranularity; periods?: number } = {},
  ) {
    const params = new URLSearchParams();
    if (input.granularity) params.set("granularity", input.granularity);
    if (input.periods) params.set("periods", String(input.periods));

    return request<AdminSupportTrendPoint[]>(
      "/api/admin/analytics/support-trends",
      { token },
      params,
    );
  },

  async getAdminTopAreas(token: string, limit = 12) {
    const params = new URLSearchParams({ limit: String(limit) });
    return request<AdminTopArea[]>("/api/admin/analytics/top-areas", { token }, params);
  },

  async getAdminDuplicateConcentration(token: string, limit = 12) {
    const params = new URLSearchParams({ limit: String(limit) });
    return request<AdminDistributionItem[]>(
      "/api/admin/analytics/duplicate-concentration",
      { token },
      params,
    );
  },

  async getAdminHeatmap(
    token: string,
    input: {
      categoryId?: string | null;
      status?: string | null;
      moderationState?: string | null;
      days?: number;
      minimumPublicScore?: number;
      limit?: number;
    } = {},
  ) {
    const params = new URLSearchParams();
    if (input.categoryId) params.set("category_id", input.categoryId);
    if (input.status) params.set("status", input.status);
    if (input.moderationState) params.set("moderation_state", input.moderationState);
    if (input.days) params.set("days", String(input.days));
    if (typeof input.minimumPublicScore === "number") {
      params.set("minimum_public_score", String(input.minimumPublicScore));
    }
    if (input.limit) params.set("limit", String(input.limit));

    return request<AdminHeatPoint[]>("/api/admin/analytics/heatmap", { token }, params);
  },

  async recalculateAdminUserIntegrity(token: string, userId: string) {
    return request<UserIntegrityDetail>(
      `/api/admin/users/${userId}/integrity/recalculate`,
      {
        method: "POST",
        token,
      },
    );
  },

  async listOwnTickets(token: string) {
    return request<SupportTicket[]>("/api/tickets/me", { token });
  },

  async createTicket(
    token: string,
    input: {
      issue_id: string | null;
      type: "appeal" | "bug_report" | "improvement";
      subject: string;
      message: string;
    },
  ) {
    return request<SupportTicket>("/api/tickets", {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },

  async suggestDuplicates(input: {
    title: string;
    short_description: string;
    latitude: number;
    longitude: number;
    category_id?: string | null;
  }) {
    return request<DuplicateSuggestionResponse>("/api/public/issues/duplicates", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async rewriteIssueText(input: {
    title: string;
    short_description: string;
    category_id?: string | null;
    source_locale?: string;
    context_hint?: string | null;
  }) {
    return request<RewriteResponse>("/api/public/issues/rewrite", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async sendIssueFeedback(
    token: string,
    issueId: string,
    action: SwipeAction,
  ) {
    return request<IssueFeedbackResponse>(`/api/public/issues/${issueId}/feedback`, {
      method: "POST",
      token,
      body: JSON.stringify({ action }),
    });
  },

  async supportExistingIssue(
    token: string,
    issueId: string,
    input: SupportExistingIssueInput,
  ) {
    return request<SupportExistingIssueResponse>(`/api/public/issues/${issueId}/support`, {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },
};
