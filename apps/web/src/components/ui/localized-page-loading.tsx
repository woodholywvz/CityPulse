"use client";

import { PageLoading } from "@/components/ui/page-loading";
import { useAdminCopy, useAppCopy } from "@/lib/i18n-provider";

type LocalizedPageLoadingProps = Readonly<{
  kind:
    | "admin"
    | "admin-user-detail"
    | "auth"
    | "issues"
    | "issue-detail"
    | "create"
    | "discover"
    | "my-issues";
}>;

export function LocalizedPageLoading({ kind }: LocalizedPageLoadingProps) {
  const appCopy = useAppCopy();
  const adminCopy = useAdminCopy();

  const title =
    kind === "admin"
      ? adminCopy.common.loading
      : kind === "auth"
        ? appCopy.auth.title
        : kind === "issues"
          ? appCopy.issueViews.loadingTitle
          : kind === "issue-detail"
            ? appCopy.issueViews.detailMeta
            : kind === "create"
              ? appCopy.create.title
              : kind === "discover"
                ? appCopy.discover.title
                : kind === "my-issues"
                  ? appCopy.myIssues.title
                  : appCopy.common.loading;

  return <PageLoading title={title} />;
}
