"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AuthRequiredCard } from "@/components/auth/auth-required-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineMessage } from "@/components/ui/inline-message";
import { PageLoading } from "@/components/ui/page-loading";
import { Select } from "@/components/ui/select";
import { adminConsoleCopy } from "@/content/admin-console";
import {
  AdminMetricCard,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminSurface,
} from "@/features/admin-console/components/admin-primitives";
import { useAdminIssues } from "@/features/admin-console/hooks/use-admin-console";
import {
  formatAbuseRiskLabel,
  formatCompactNumber,
  formatIssueDate,
  formatIssueStatus,
  formatLifecycleLabel,
  formatStatusTone,
} from "@/features/admin-console/lib/presenters";
import { useIssueCategories } from "@/features/issues/hooks/use-public-issues";
import { useAuth } from "@/lib/auth/auth-provider";

type AdminIssuesScreenProps = Readonly<{
  locale: string;
}>;

const ISSUE_STATUS_OPTIONS = [
  "",
  "pending_moderation",
  "approved",
  "rejected",
  "published",
  "archived",
] as const;

const MODERATION_STATE_OPTIONS = ["", "queued", "under_review", "completed"] as const;
const ISSUE_STATUS_VALUES = ISSUE_STATUS_OPTIONS.filter(
  (value): value is Exclude<(typeof ISSUE_STATUS_OPTIONS)[number], ""> => Boolean(value),
);
const MODERATION_STATE_VALUES = MODERATION_STATE_OPTIONS.filter(
  (value): value is Exclude<(typeof MODERATION_STATE_OPTIONS)[number], ""> => Boolean(value),
);

export function AdminIssuesScreen({ locale }: AdminIssuesScreenProps) {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [status, setStatus] = useState<string>("");
  const [moderationState, setModerationState] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const categories = useIssueCategories();
  const issues = useAdminIssues(token, Boolean(isAdmin), {
    limit: 60,
    status: status || null,
    moderationState: moderationState || null,
    categoryId: categoryId || null,
  });

  const visibleMetrics = useMemo(() => {
    return {
      total: issues.data.length,
      published: issues.data.filter((item) => item.status === "published").length,
      review: issues.data.filter((item) => item.moderation_state === "under_review").length,
      weightedSupport: issues.data.reduce(
        (total, item) => total + item.trust_weighted_support_total,
        0,
      ),
    };
  }, [issues.data]);

  if (!user) {
    return <AuthRequiredCard locale={locale} />;
  }

  if (!isAdmin) {
    return <InlineMessage variant="error">{adminConsoleCopy.common.adminOnly}</InlineMessage>;
  }

  const error = categories.error || issues.error;

  return (
    <section className="space-y-6">
      <AdminSurface>
        <AdminSectionHeader
          eyebrow={adminConsoleCopy.issues.eyebrow}
          title={adminConsoleCopy.issues.title}
          body={adminConsoleCopy.issues.description}
        />
      </AdminSurface>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label={adminConsoleCopy.issues.listTitle}
          value={formatCompactNumber(visibleMetrics.total)}
        />
        <AdminMetricCard
          label={adminConsoleCopy.common.published}
          value={formatCompactNumber(visibleMetrics.published)}
          tone="primary"
        />
        <AdminMetricCard
          label={adminConsoleCopy.common.manualReview}
          value={formatCompactNumber(visibleMetrics.review)}
          tone="accent"
        />
        <AdminMetricCard
          label={adminConsoleCopy.issues.supportMetricsTitle}
          value={visibleMetrics.weightedSupport.toFixed(1)}
        />
      </div>

      <AdminSurface>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">
              {adminConsoleCopy.common.filterStatus}
            </span>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">{adminConsoleCopy.common.filterAll}</option>
              {ISSUE_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {formatIssueStatus(value)}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">
              {adminConsoleCopy.common.filterModeration}
            </span>
            <Select
              value={moderationState}
              onChange={(event) => setModerationState(event.target.value)}
            >
              <option value="">{adminConsoleCopy.common.filterAll}</option>
              {MODERATION_STATE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {formatLifecycleLabel(value)}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">
              {adminConsoleCopy.common.filterCategory}
            </span>
            <Select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">{adminConsoleCopy.common.filterAll}</option>
              {categories.data.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.display_name}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </AdminSurface>

      {error ? <InlineMessage variant="error">{error}</InlineMessage> : null}

      {issues.isLoading ? (
        <PageLoading title={adminConsoleCopy.common.loading} />
      ) : issues.data.length ? (
        <div className="grid gap-4">
          {issues.data.map((issue) => (
            <AdminSurface key={issue.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge label={issue.category.display_name} tone="primary" />
                    <AdminStatusBadge
                      label={formatIssueStatus(issue.status)}
                      tone={formatStatusTone(issue.status)}
                    />
                    <AdminStatusBadge
                      label={formatLifecycleLabel(issue.moderation_state)}
                      tone={formatStatusTone(issue.moderation_state)}
                    />
                    {issue.author ? (
                      <AdminStatusBadge
                        label={formatAbuseRiskLabel(issue.author.abuse_risk_level)}
                        tone={formatStatusTone(issue.author.abuse_risk_level)}
                      />
                    ) : null}
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-semibold text-white">
                    {issue.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {issue.short_description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <span>{issue.location_snippet}</span>
                    <span>{formatIssueDate(issue.created_at)}</span>
                    <span>{formatCompactNumber(issue.support_count)}</span>
                    <span>{issue.trust_weighted_support_total.toFixed(2)}</span>
                    <span>{issue.duplicate_count}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline">
                    <Link href={`/${locale}/admin/issues/${issue.id}` as Route}>
                      {adminConsoleCopy.common.openIssue}
                    </Link>
                  </Button>
                </div>
              </div>
            </AdminSurface>
          ))}
        </div>
      ) : (
        <EmptyState
          title={adminConsoleCopy.issues.emptyTitle}
          body={adminConsoleCopy.issues.emptyBody}
        />
      )}
    </section>
  );
}
