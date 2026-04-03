export type UserRole = "citizen" | "admin";

export type IssueStatus =
  | "draft"
  | "pending_moderation"
  | "approved"
  | "rejected"
  | "published"
  | "archived";

export type ModerationState =
  | "not_requested"
  | "queued"
  | "under_review"
  | "completed";
export type ModerationLayer = "deterministic" | "llm";
export type AbuseRiskLevel = "low" | "medium" | "high";
export type IntegrityEventSeverity = "low" | "medium" | "high";
export type ModerationResultStatus =
  | "queued"
  | "approved"
  | "needs_review"
  | "rejected";

export type SwipeAction =
  | "support"
  | "skip"
  | "more_like_this"
  | "less_like_this";

export type PublicIssueSort = "top" | "recent" | "nearby";
export type PublicIssueStatus = Extract<IssueStatus, "published" | "archived">;
export type DuplicateLookupStatus =
  | "no_match"
  | "possible_duplicates"
  | "high_confidence_duplicate";
export type DuplicateRecommendedAction =
  | "support_existing"
  | "review_before_submit"
  | "submit_new_issue";
export type RewriteToneClassification =
  | "constructive"
  | "neutral"
  | "frustrated"
  | "accusatory"
  | "rage"
  | "low_signal";

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    request_id?: string | null;
  };
};

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  preferred_locale: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminUserIdentity = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  preferred_locale: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

export type IntegrityFactor = {
  name: string;
  label: string;
  effect: "positive" | "negative" | "risk";
  signal: number | null;
  points: number | null;
  details: Record<string, unknown>;
};

export type IntegrityEvent = {
  id: string;
  event_type: string;
  severity: IntegrityEventSeverity;
  entity_type: string | null;
  entity_id: string | null;
  summary: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type UserIntegrityCompact = {
  user: AdminUserIdentity;
  trust_score: number;
  trust_weight_multiplier: number;
  abuse_risk_level: AbuseRiskLevel;
  abuse_risk_score: number;
  sanction_count: number;
  summary: string | null;
  updated_at: string;
};

export type UserIntegritySummary = UserIntegrityCompact & {
  trust_factors: IntegrityFactor[];
  abuse_factors: IntegrityFactor[];
  recommended_actions: string[];
  metrics: Record<string, unknown>;
};

export type UserIntegrityDetail = UserIntegritySummary & {
  recent_events: IntegrityEvent[];
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type IssueCategory = {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  severity_baseline: number;
  affected_people_baseline: number;
};

export type IssueAttachment = {
  id: string;
  issue_id: string;
  uploader_id: string;
  storage_key: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
};

export type ModerationReason = {
  code: string;
  label: string;
  severity: "low" | "medium" | "high";
  evidence: string | null;
};

export type IssueModerationSummary = {
  id: string;
  layer: ModerationLayer;
  status: ModerationResultStatus;
  decision_code: string;
  provider_name: string | null;
  model_name: string | null;
  confidence: number | null;
  summary: string | null;
  user_safe_explanation: string | null;
  escalation_required: boolean;
  machine_reasons: ModerationReason[];
  normalized_category_slug: string | null;
  created_at: string;
};

export type IssueModerationAdmin = IssueModerationSummary & {
  internal_notes: string | null;
  flags: Record<string, unknown>;
};

export type IssueModerationAudit = {
  issue_id: string;
  author: UserIntegrityCompact | null;
  issue_status: IssueStatus;
  moderation_state: ModerationState;
  latest_result: IssueModerationSummary | null;
  results: IssueModerationAdmin[];
};

export type AdminModerationIssue = {
  id: string;
  author: UserIntegrityCompact | null;
  title: string;
  short_description: string;
  source_locale: string;
  status: IssueStatus;
  moderation_state: ModerationState;
  category: IssueCategory;
  created_at: string;
  updated_at: string;
  attachment_count: number;
  latest_moderation: IssueModerationSummary | null;
};

export type PublicIssueSummary = {
  id: string;
  title: string;
  short_description: string;
  latitude: number;
  longitude: number;
  category: IssueCategory;
  location_snippet: string;
  support_count: number;
  public_impact_score: number | null;
  affected_people_estimate: number | null;
  importance_label: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  distance_km: number | null;
};

export type PublicIssueDetail = {
  id: string;
  title: string;
  short_description: string;
  latitude: number;
  longitude: number;
  category: IssueCategory;
  location_snippet: string;
  support_count: number;
  public_impact_score: number | null;
  affected_people_estimate: number | null;
  importance_label: string | null;
  cover_image_url: string | null;
  source_locale: string;
  attachments: IssueAttachment[];
  created_at: string;
  updated_at: string;
};

export type Issue = {
  id: string;
  author_id: string;
  title: string;
  short_description: string;
  latitude: number;
  longitude: number;
  status: IssueStatus;
  moderation_state: ModerationState;
  source_locale: string;
  category: IssueCategory;
  attachments: IssueAttachment[];
  support_count: number;
  location_snippet: string;
  public_impact_score: number | null;
  affected_people_estimate: number | null;
  latest_moderation: IssueModerationSummary | null;
  created_at: string;
  updated_at: string;
};

export type PublicIssueMapMarker = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  category: IssueCategory;
  location_snippet: string;
  support_count: number;
  public_impact_score: number | null;
  affected_people_estimate: number | null;
  importance_label: string | null;
};

export type IssuePublicImpact = {
  issue_id: string;
  public_impact_score: number;
  affected_people_estimate: number;
  importance_label: string;
  score_version: string;
  updated_at: string;
};

export type IssueImpactFactor = {
  name: string;
  label: string;
  weight: number;
  signal: number;
  contribution: number;
  raw_value: string | number | null;
  details: Record<string, unknown>;
};

export type IssueImpactAdmin = IssuePublicImpact & {
  signals: Record<string, unknown>;
  factors: IssueImpactFactor[];
  calculation_notes: string[];
};

export type DuplicateSuggestion = {
  issue: PublicIssueSummary;
  existing_issue_id: string;
  similarity_score: number;
  reason_breakdown: string[];
  distance_km: number;
  text_similarity: number;
  category_match: boolean;
  recommended_action: DuplicateRecommendedAction;
  image_similarity: number | null;
};

export type DuplicateSuggestionResponse = {
  status: DuplicateLookupStatus;
  matches: DuplicateSuggestion[];
};

export type RewriteResponse = {
  rewritten_title: string;
  rewritten_description: string;
  explanation: string;
  tone_classification: RewriteToneClassification | null;
};

export type IssueFeedbackResponse = {
  issue_id: string;
  action: SwipeAction;
  support_count: number;
  support_changed: boolean;
  public_impact_score: number | null;
  affected_people_estimate: number | null;
};

export type SupportExistingIssueInput = {
  candidate_title?: string | null;
  candidate_description?: string | null;
  candidate_category_id?: string | null;
  candidate_latitude?: number | null;
  candidate_longitude?: number | null;
  similarity_score?: number | null;
  distance_km?: number | null;
  text_similarity?: number | null;
  category_match?: boolean;
  reason_breakdown?: string[];
  image_hashes?: string[];
};

export type SupportExistingIssueResponse = {
  canonical_issue_id: string;
  duplicate_link_id: string | null;
  support_count: number;
  support_changed: boolean;
  public_impact_score: number;
  affected_people_estimate: number;
};

export type SupportTicketMessage = {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
};

export type SupportTicket = {
  id: string;
  issue_id: string | null;
  author_id: string;
  type: "appeal" | "bug_report" | "improvement";
  status:
    | "open"
    | "under_review"
    | "waiting_for_user"
    | "resolved"
    | "closed";
  subject: string;
  messages: SupportTicketMessage[];
  created_at: string;
  updated_at: string;
};

export type AnalyticsGranularity = "day" | "week" | "month";

export type AdminDistributionItem = {
  key: string;
  label: string;
  count: number;
  share: number;
  numeric_value: number | null;
};

export type AdminActivityTrendPoint = {
  bucket_start: string;
  label: string;
  issue_submissions: number;
  support_actions: number;
  tickets_created: number;
};

export type AdminSupportTrendPoint = {
  bucket_start: string;
  label: string;
  support: number;
  skip: number;
  more_like_this: number;
  less_like_this: number;
};

export type AdminImpactDistributionBucket = {
  range_key: string;
  min_score: number;
  max_score: number;
  count: number;
};

export type AdminHeatPoint = {
  area_key: string;
  label: string;
  latitude: number;
  longitude: number;
  intensity: number;
  issue_count: number;
  trust_weighted_activity: number;
  duplicate_count: number;
  needs_review_count: number;
  published_count: number;
  top_category_slug: string | null;
  average_impact_score: number | null;
};

export type PublicHeatPoint = {
  area_key: string;
  label: string;
  latitude: number;
  longitude: number;
  intensity: number;
  issue_count: number;
  top_category_slug: string | null;
};

export type AdminTopArea = {
  area_key: string;
  label: string;
  issue_count: number;
  total_impact_score: number;
  average_impact_score: number;
  latitude: number;
  longitude: number;
  dominant_category_slug: string | null;
};

export type AdminIssueSummary = {
  id: string;
  title: string;
  short_description: string;
  status: IssueStatus;
  moderation_state: ModerationState;
  category: IssueCategory;
  author: UserIntegrityCompact | null;
  location_snippet: string;
  support_count: number;
  trust_weighted_support_total: number;
  duplicate_count: number;
  public_impact_score: number | null;
  affected_people_estimate: number | null;
  created_at: string;
  updated_at: string;
};

export type AdminDashboardIssueVolume = {
  total_issues: number;
  new_last_7_days: number;
  published_count: number;
  pending_count: number;
  archived_count: number;
};

export type AdminDashboardModeration = {
  approved_count: number;
  rejected_count: number;
  needs_review_count: number;
  queued_count: number;
};

export type AdminDashboardTrust = {
  average_trust_score: number;
  high_abuse_risk_users: number;
  medium_abuse_risk_users: number;
  banned_users: number;
  sanctioned_users: number;
};

export type AdminDashboardTicketQueue = {
  open_count: number;
  under_review_count: number;
  waiting_for_user_count: number;
  resolved_count: number;
  appeal_count: number;
  bug_report_count: number;
  improvement_count: number;
};

export type AdminDashboardReaction = {
  support_count: number;
  skip_count: number;
  more_like_this_count: number;
  less_like_this_count: number;
};

export type AdminTicketListItem = {
  id: string;
  issue_id: string | null;
  author: AdminUserIdentity;
  type: "appeal" | "bug_report" | "improvement";
  status:
    | "open"
    | "under_review"
    | "waiting_for_user"
    | "resolved"
    | "closed";
  subject: string;
  message_count: number;
  latest_message_preview: string | null;
  latest_message_at: string | null;
  issue_title: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminDashboard = {
  issue_volume: AdminDashboardIssueVolume;
  moderation_overview: AdminDashboardModeration;
  impact_distribution: AdminImpactDistributionBucket[];
  top_priority_issues: AdminIssueSummary[];
  trust_overview: AdminDashboardTrust;
  ticket_queue: AdminDashboardTicketQueue;
  reaction_overview: AdminDashboardReaction;
  activity_trends: AdminActivityTrendPoint[];
  recent_tickets: AdminTicketListItem[];
  recent_moderation: AdminModerationIssue[];
  heatmap_preview: AdminHeatPoint[];
};

export type AdminDuplicateLink = {
  id: string;
  status:
    | "possible"
    | "confirmed"
    | "rejected"
    | "supported_existing";
  canonical_issue_id: string;
  duplicate_issue_id: string | null;
  canonical_issue_title: string | null;
  duplicate_issue_title: string | null;
  similarity_score: number | null;
  distance_km: number | null;
  text_similarity: number | null;
  category_match: boolean;
  reason_breakdown: string[];
  created_at: string;
};

export type AdminIssueSupportMetrics = {
  support_count: number;
  trust_weighted_support_total: number;
  skip_count: number;
  more_like_this_count: number;
  less_like_this_count: number;
};

export type AdminActionLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  note: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  admin: AdminUserIdentity | null;
};

export type AdminIssueDetail = {
  issue: AdminIssueSummary;
  attachments: IssueAttachment[];
  moderation_results: IssueModerationAdmin[];
  impact: IssueImpactAdmin;
  support_metrics: AdminIssueSupportMetrics;
  canonical_duplicates: AdminDuplicateLink[];
  duplicate_of: AdminDuplicateLink[];
  admin_actions: AdminActionLog[];
};

export type AdminIssueActionKind =
  | "approve"
  | "reject"
  | "publish"
  | "archive"
  | "reopen";

export type AdminIssueActionInput = {
  action: AdminIssueActionKind;
  note?: string | null;
  bypass_ai?: boolean;
};

export type AdminIssueDuplicateLinkInput = {
  canonical_issue_id: string;
  note?: string | null;
  archive_duplicate?: boolean;
  similarity_score?: number | null;
  distance_km?: number | null;
  text_similarity?: number | null;
  category_match?: boolean;
  reason_breakdown?: string[];
};

export type AdminTicketMessage = {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  body: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminTicketDetail = {
  id: string;
  issue_id: string | null;
  author: AdminUserIdentity;
  type: "appeal" | "bug_report" | "improvement";
  status:
    | "open"
    | "under_review"
    | "waiting_for_user"
    | "resolved"
    | "closed";
  subject: string;
  issue_title: string | null;
  issue_status: IssueStatus | null;
  latest_moderation_code: string | null;
  messages: AdminTicketMessage[];
  created_at: string;
  updated_at: string;
};

export type AdminTicketReplyInput = {
  body: string;
  is_internal?: boolean;
  status?:
    | "open"
    | "under_review"
    | "waiting_for_user"
    | "resolved"
    | "closed"
    | null;
};

export type AdminTicketStatusInput = {
  status: "open" | "under_review" | "waiting_for_user" | "resolved" | "closed";
  note?: string | null;
};

export type AdminUserIssueHistory = {
  id: string;
  title: string;
  status: IssueStatus;
  moderation_state: ModerationState;
  public_impact_score: number | null;
  created_at: string;
};

export type AdminUserTicketHistory = {
  id: string;
  subject: string;
  type: "appeal" | "bug_report" | "improvement";
  status: "open" | "under_review" | "waiting_for_user" | "resolved" | "closed";
  issue_id: string | null;
  created_at: string;
};

export type AdminUserModerationHistory = {
  issue_id: string;
  issue_title: string;
  layer: string;
  status: string;
  decision_code: string;
  created_at: string;
};

export type AdminUserReactionPattern = {
  action: SwipeAction;
  count: number;
};

export type AdminUserProfile = {
  identity: AdminUserIdentity;
  integrity: UserIntegrityCompact | null;
  recent_events: IntegrityEvent[];
  trust_factors: IntegrityFactor[];
  abuse_factors: IntegrityFactor[];
  recommended_actions: string[];
  metrics: Record<string, unknown>;
  recent_issues: AdminUserIssueHistory[];
  recent_tickets: AdminUserTicketHistory[];
  moderation_history: AdminUserModerationHistory[];
  reaction_patterns: AdminUserReactionPattern[];
};

export type AdminUserActionInput = {
  note?: string | null;
};
