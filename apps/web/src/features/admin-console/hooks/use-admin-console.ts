"use client";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { apiClient } from "@/lib/api/client";
import type {
  AdminDashboard,
  AdminDistributionItem,
  AdminHeatPoint,
  AdminIssueDetail,
  AdminIssueSummary,
  AdminSupportTrendPoint,
  AdminTicketDetail,
  AdminTicketListItem,
  AdminTopArea,
  AdminUserProfile,
  AnalyticsGranularity,
  UserIntegritySummary,
} from "@/lib/api/types";

export function useAdminDashboard(token: string | null, enabled: boolean) {
  return useAsyncResource<AdminDashboard | null>({
    initialValue: null,
    enabled: Boolean(token) && enabled,
    deps: [token ?? "", enabled],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve(null);
      }
      return apiClient.getAdminDashboard(token);
    },
  });
}

export function useAdminIssues(
  token: string | null,
  enabled: boolean,
  input: {
    limit?: number;
    status?: string | null;
    moderationState?: string | null;
    categoryId?: string | null;
    authorId?: string | null;
  },
) {
  return useAsyncResource<AdminIssueSummary[]>({
    initialValue: [],
    enabled: Boolean(token) && enabled,
    deps: [
      token ?? "",
      enabled,
      input.limit ?? 40,
      input.status ?? "",
      input.moderationState ?? "",
      input.categoryId ?? "",
      input.authorId ?? "",
    ],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve([]);
      }
      return apiClient.listAdminIssues(token, input);
    },
  });
}

export function useAdminIssueDetail(
  token: string | null,
  enabled: boolean,
  issueId: string | null,
) {
  return useAsyncResource<AdminIssueDetail | null>({
    initialValue: null,
    enabled: Boolean(token && issueId) && enabled,
    deps: [token ?? "", enabled, issueId ?? ""],
    load: () => {
      if (!token || !issueId || !enabled) {
        return Promise.resolve(null);
      }
      return apiClient.getAdminIssueDetail(token, issueId);
    },
  });
}

export function useAdminTickets(
  token: string | null,
  enabled: boolean,
  input: {
    limit?: number;
    status?: string | null;
    ticketType?: string | null;
  },
) {
  return useAsyncResource<AdminTicketListItem[]>({
    initialValue: [],
    enabled: Boolean(token) && enabled,
    deps: [
      token ?? "",
      enabled,
      input.limit ?? 40,
      input.status ?? "",
      input.ticketType ?? "",
    ],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve([]);
      }
      return apiClient.listAdminTickets(token, input);
    },
  });
}

export function useAdminTicketDetail(
  token: string | null,
  enabled: boolean,
  ticketId: string | null,
) {
  return useAsyncResource<AdminTicketDetail | null>({
    initialValue: null,
    enabled: Boolean(token && ticketId) && enabled,
    deps: [token ?? "", enabled, ticketId ?? ""],
    load: () => {
      if (!token || !ticketId || !enabled) {
        return Promise.resolve(null);
      }
      return apiClient.getAdminTicketDetail(token, ticketId);
    },
  });
}

export function useAdminUsers(token: string | null, enabled: boolean, limit = 48) {
  return useAsyncResource<UserIntegritySummary[]>({
    initialValue: [],
    enabled: Boolean(token) && enabled,
    deps: [token ?? "", enabled, limit],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve([]);
      }
      return apiClient.listAdminUsers(token, limit);
    },
  });
}

export function useAdminUserProfile(
  token: string | null,
  enabled: boolean,
  userId: string | null,
) {
  return useAsyncResource<AdminUserProfile | null>({
    initialValue: null,
    enabled: Boolean(token && userId) && enabled,
    deps: [token ?? "", enabled, userId ?? ""],
    load: () => {
      if (!token || !userId || !enabled) {
        return Promise.resolve(null);
      }
      return apiClient.getAdminUserProfile(token, userId);
    },
  });
}

export function useAdminActivityTrends(
  token: string | null,
  enabled: boolean,
  granularity: AnalyticsGranularity,
  periods: number,
) {
  return useAsyncResource({
    initialValue: [] as AdminDashboard["activity_trends"],
    enabled: Boolean(token) && enabled,
    deps: [token ?? "", enabled, granularity, periods],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve([]);
      }
      return apiClient.getAdminActivityTrends(token, { granularity, periods });
    },
  });
}

export function useAdminSupportTrends(
  token: string | null,
  enabled: boolean,
  granularity: AnalyticsGranularity,
  periods: number,
) {
  return useAsyncResource<AdminSupportTrendPoint[]>({
    initialValue: [],
    enabled: Boolean(token) && enabled,
    deps: [token ?? "", enabled, granularity, periods],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve([]);
      }
      return apiClient.getAdminSupportTrends(token, { granularity, periods });
    },
  });
}

export function useAdminCategoryDistribution(token: string | null, enabled: boolean) {
  return useAsyncResource<AdminDistributionItem[]>({
    initialValue: [],
    enabled: Boolean(token) && enabled,
    deps: [token ?? "", enabled],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve([]);
      }
      return apiClient.getAdminCategoryDistribution(token);
    },
  });
}

export function useAdminModerationDistribution(
  token: string | null,
  enabled: boolean,
) {
  return useAsyncResource<AdminDistributionItem[]>({
    initialValue: [],
    enabled: Boolean(token) && enabled,
    deps: [token ?? "", enabled],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve([]);
      }
      return apiClient.getAdminModerationOutcomes(token);
    },
  });
}

export function useAdminTrustDistribution(token: string | null, enabled: boolean) {
  return useAsyncResource<AdminDistributionItem[]>({
    initialValue: [],
    enabled: Boolean(token) && enabled,
    deps: [token ?? "", enabled],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve([]);
      }
      return apiClient.getAdminTrustDistribution(token);
    },
  });
}

export function useAdminAbuseIncidents(
  token: string | null,
  enabled: boolean,
  days = 90,
) {
  return useAsyncResource<AdminDistributionItem[]>({
    initialValue: [],
    enabled: Boolean(token) && enabled,
    deps: [token ?? "", enabled, days],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve([]);
      }
      return apiClient.getAdminAbuseIncidents(token, days);
    },
  });
}

export function useAdminTopAreas(token: string | null, enabled: boolean, limit = 12) {
  return useAsyncResource<AdminTopArea[]>({
    initialValue: [],
    enabled: Boolean(token) && enabled,
    deps: [token ?? "", enabled, limit],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve([]);
      }
      return apiClient.getAdminTopAreas(token, limit);
    },
  });
}

export function useAdminDuplicateConcentration(
  token: string | null,
  enabled: boolean,
  limit = 12,
) {
  return useAsyncResource<AdminDistributionItem[]>({
    initialValue: [],
    enabled: Boolean(token) && enabled,
    deps: [token ?? "", enabled, limit],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve([]);
      }
      return apiClient.getAdminDuplicateConcentration(token, limit);
    },
  });
}

export function useAdminHeatmap(
  token: string | null,
  enabled: boolean,
  input: {
    categoryId?: string | null;
    status?: string | null;
    moderationState?: string | null;
    days?: number;
    minimumPublicScore?: number;
    limit?: number;
  },
) {
  return useAsyncResource<AdminHeatPoint[]>({
    initialValue: [],
    enabled: Boolean(token) && enabled,
    deps: [
      token ?? "",
      enabled,
      input.categoryId ?? "",
      input.status ?? "",
      input.moderationState ?? "",
      input.days ?? 180,
      input.minimumPublicScore ?? 0,
      input.limit ?? 160,
    ],
    load: () => {
      if (!token || !enabled) {
        return Promise.resolve([]);
      }
      return apiClient.getAdminHeatmap(token, input);
    },
  });
}
