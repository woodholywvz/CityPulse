"use client";

import { apiClient } from "@/lib/api/client";
import type { Issue } from "@/lib/api/types";
import { useAsyncResource } from "@/hooks/use-async-resource";

export function useMyIssues(token: string | null) {
  return useAsyncResource<Issue[]>({
    initialValue: [],
    enabled: Boolean(token),
    deps: [token ?? ""],
    load: () => {
      if (!token) {
        return Promise.resolve([]);
      }
      return apiClient.listOwnIssues(token);
    },
  });
}
