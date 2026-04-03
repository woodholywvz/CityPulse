"use client";

import { useState } from "react";

import { AuthRequiredCard } from "@/components/auth/auth-required-card";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineMessage } from "@/components/ui/inline-message";
import { PageLoading } from "@/components/ui/page-loading";
import { Select } from "@/components/ui/select";
import { adminConsoleCopy } from "@/content/admin-console";
import {
  AdminSectionHeader,
  AdminStatusBadge,
  AdminSurface,
} from "@/features/admin-console/components/admin-primitives";
import {
  useAdminCategoryDistribution,
  useAdminHeatmap,
  useAdminModerationDistribution,
  useAdminTopAreas,
} from "@/features/admin-console/hooks/use-admin-console";
import {
  formatCompactNumber,
  formatIssueStatus,
  formatLifecycleLabel,
} from "@/features/admin-console/lib/presenters";
import { IssueHeatmapMap } from "@/features/issues/components/issue-heatmap-map";
import { useIssueCategories } from "@/features/issues/hooks/use-public-issues";
import { useAuth } from "@/lib/auth/auth-provider";

type AdminHeatmapScreenProps = Readonly<{
  locale: string;
}>;

const STATUS_OPTIONS = [
  "",
  "pending_moderation",
  "approved",
  "rejected",
  "published",
  "archived",
] as const;
const MODERATION_OPTIONS = ["", "queued", "under_review", "completed"] as const;
const RANGE_OPTIONS = [30, 90, 180, 365] as const;
const ISSUE_STATUS_VALUES = STATUS_OPTIONS.filter(
  (value): value is Exclude<(typeof STATUS_OPTIONS)[number], ""> => Boolean(value),
);
const MODERATION_VALUES = MODERATION_OPTIONS.filter(
  (value): value is Exclude<(typeof MODERATION_OPTIONS)[number], ""> => Boolean(value),
);

export function AdminHeatmapScreen({ locale }: AdminHeatmapScreenProps) {
  void locale;
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedAreaKey, setSelectedAreaKey] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [moderationState, setModerationState] = useState("");
  const [days, setDays] = useState<number>(180);
  const categories = useIssueCategories();
  const heatmap = useAdminHeatmap(token, Boolean(isAdmin), {
    categoryId: categoryId || null,
    status: status || null,
    moderationState: moderationState || null,
    days,
    minimumPublicScore: 0,
    limit: 220,
  });
  const topAreas = useAdminTopAreas(token, Boolean(isAdmin), 10);
  const categoryDistribution = useAdminCategoryDistribution(token, Boolean(isAdmin));
  const moderationDistribution = useAdminModerationDistribution(token, Boolean(isAdmin));

  if (!user) {
    return <AuthRequiredCard locale={locale} />;
  }

  if (!isAdmin) {
    return <InlineMessage variant="error">{adminConsoleCopy.common.adminOnly}</InlineMessage>;
  }

  const selectedPoint =
    heatmap.data.find((point) => point.area_key === selectedAreaKey) ?? heatmap.data[0] ?? null;

  const error =
    categories.error ||
    heatmap.error ||
    topAreas.error ||
    categoryDistribution.error ||
    moderationDistribution.error;

  const pointSummary = selectedPoint
    ? [
        {
          label: adminConsoleCopy.heatmap.issueCount,
          value: formatCompactNumber(selectedPoint.issue_count),
        },
        {
          label: adminConsoleCopy.heatmap.trustWeightedActivity,
          value: selectedPoint.trust_weighted_activity.toFixed(2),
        },
        {
          label: adminConsoleCopy.heatmap.duplicateCount,
          value: formatCompactNumber(selectedPoint.duplicate_count),
        },
        {
          label: adminConsoleCopy.heatmap.needsReviewCount,
          value: formatCompactNumber(selectedPoint.needs_review_count),
        },
        {
          label: adminConsoleCopy.heatmap.averageImpact,
          value:
            typeof selectedPoint.average_impact_score === "number"
              ? `${selectedPoint.average_impact_score.toFixed(1)}/10`
              : adminConsoleCopy.common.noData,
        },
        {
          label: adminConsoleCopy.heatmap.topCategory,
          value: selectedPoint.top_category_slug ?? adminConsoleCopy.common.noData,
        },
      ]
    : [];

  return (
    <section className="space-y-6">
      <AdminSurface>
        <AdminSectionHeader
          eyebrow={adminConsoleCopy.heatmap.eyebrow}
          title={adminConsoleCopy.heatmap.title}
          body={adminConsoleCopy.heatmap.description}
        />
      </AdminSurface>

      <AdminSurface>
        <AdminSectionHeader title={adminConsoleCopy.heatmap.filtersTitle} />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">
              {adminConsoleCopy.common.filterCategory}
            </span>
            <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">{adminConsoleCopy.common.filterAll}</option>
              {categories.data.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.display_name}
                </option>
              ))}
            </Select>
          </label>
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
              {MODERATION_VALUES.map((value) => (
                <option key={value} value={value}>
                  {formatLifecycleLabel(value)}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">
              {adminConsoleCopy.common.filterPeriod}
            </span>
            <Select value={String(days)} onChange={(event) => setDays(Number(event.target.value))}>
              {RANGE_OPTIONS.map((value) => (
                <option key={value} value={String(value)}>
                  {value}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">
              {adminConsoleCopy.common.filterScore}
            </span>
            <Select defaultValue="0">
              <option value="0">0+</option>
            </Select>
          </label>
        </div>
      </AdminSurface>

      {error ? <InlineMessage variant="error">{error}</InlineMessage> : null}

      {heatmap.isLoading ? (
        <PageLoading title={adminConsoleCopy.common.loading} />
      ) : heatmap.data.length ? (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <AdminSurface className="overflow-hidden p-3">
            <IssueHeatmapMap
              points={heatmap.data}
              selectedAreaKey={selectedAreaKey}
              onSelectPoint={setSelectedAreaKey}
              issueCountLabel={adminConsoleCopy.heatmap.issueCount}
              secondaryLine={(point) =>
                "average_impact_score" in point && typeof point.average_impact_score === "number"
                  ? `${point.average_impact_score.toFixed(1)}/10`
                  : null
              }
              heightClassName="h-[620px]"
            />
          </AdminSurface>

          <div className="space-y-6">
            <AdminSurface>
              <AdminSectionHeader
                title={adminConsoleCopy.heatmap.previewTitle}
                body={adminConsoleCopy.heatmap.previewBody}
              />
              {selectedPoint ? (
                <div className="mt-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge label={selectedPoint.label} tone="primary" />
                    {selectedPoint.top_category_slug ? (
                      <AdminStatusBadge
                        label={selectedPoint.top_category_slug}
                        tone="subtle"
                      />
                    ) : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {pointSummary.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm text-slate-100">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-sm leading-6 text-slate-300">
                  {adminConsoleCopy.common.noData}
                </p>
              )}
            </AdminSurface>

            <AdminSurface>
              <AdminSectionHeader title={adminConsoleCopy.dashboard.charts.topAreasTitle} />
              <div className="mt-6 grid gap-3">
                {topAreas.data.map((area) => (
                  <article
                    key={area.area_key}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge label={area.label} tone="primary" />
                      {area.dominant_category_slug ? (
                        <AdminStatusBadge label={area.dominant_category_slug} tone="subtle" />
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                      <span>{formatCompactNumber(area.issue_count)}</span>
                      <span>{area.average_impact_score.toFixed(1)}/10</span>
                    </div>
                  </article>
                ))}
              </div>
            </AdminSurface>

            <AdminSurface>
              <AdminSectionHeader title={adminConsoleCopy.dashboard.charts.moderationTitle} />
              <div className="mt-6 flex flex-wrap gap-2">
                {moderationDistribution.data.map((item) => (
                  <AdminStatusBadge
                    key={item.key}
                    label={`${item.label} ${formatCompactNumber(item.count)}`}
                    tone="subtle"
                  />
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {categoryDistribution.data.map((item) => (
                  <AdminStatusBadge
                    key={item.key}
                    label={`${item.label} ${formatCompactNumber(item.count)}`}
                    tone="subtle"
                  />
                ))}
              </div>
            </AdminSurface>
          </div>
        </div>
      ) : (
        <EmptyState
          title={adminConsoleCopy.heatmap.noPointsTitle}
          body={adminConsoleCopy.heatmap.noPointsBody}
        />
      )}
    </section>
  );
}
