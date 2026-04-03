"use client";

import { apiClient } from "@/lib/api/client";
import type {
  IssueCategory,
  PublicIssueDetail,
  PublicIssueMapMarker,
  PublicIssueSort,
  PublicIssueSummary,
} from "@/lib/api/types";
import { useAsyncResource } from "@/hooks/use-async-resource";

type PublicIssueQueryInput = {
  sort?: PublicIssueSort;
  categoryId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  limit?: number;
};

export function useIssueCategories() {
  return useAsyncResource<IssueCategory[]>({
    initialValue: [],
    deps: [],
    load: () => apiClient.listCategories(),
  });
}

export function usePublicIssues(input: PublicIssueQueryInput) {
  return useAsyncResource<PublicIssueSummary[]>({
    initialValue: [],
    deps: [
      input.sort ?? "recent",
      input.categoryId ?? "",
      input.latitude ?? null,
      input.longitude ?? null,
      input.limit ?? 24,
    ],
    load: () => apiClient.listPublicIssues(input),
  });
}

export function useSwipeFeed(
  input: PublicIssueQueryInput & {
    excludeIssueIds?: string[];
  },
) {
  return useAsyncResource<PublicIssueSummary[]>({
    initialValue: [],
    deps: [
      input.sort ?? "recent",
      input.categoryId ?? "",
      input.latitude ?? null,
      input.longitude ?? null,
      input.limit ?? 12,
      (input.excludeIssueIds ?? []).join(","),
    ],
    load: () => apiClient.listSwipeFeed(input),
  });
}

export function useMapIssues(
  input: Omit<PublicIssueQueryInput, "sort">,
) {
  return useAsyncResource<PublicIssueMapMarker[]>({
    initialValue: [],
    deps: [
      input.categoryId ?? "",
      input.latitude ?? null,
      input.longitude ?? null,
      input.limit ?? 80,
    ],
    load: () => apiClient.listMapIssues(input),
  });
}

export function usePublicIssueDetail(issueId: string | null, enabled = true) {
  return useAsyncResource<PublicIssueDetail | null>({
    initialValue: null,
    enabled: enabled && Boolean(issueId),
    deps: [issueId ?? ""],
    load: () => {
      if (!issueId) {
        return Promise.resolve(null);
      }
      return apiClient.getPublicIssue(issueId);
    },
  });
}
