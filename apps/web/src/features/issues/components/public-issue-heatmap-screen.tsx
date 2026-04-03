"use client";

import { useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { InlineMessage } from "@/components/ui/inline-message";
import { Select } from "@/components/ui/select";
import { publicIntelligenceCopy } from "@/content/public-intelligence";
import { IssueHeatmapMap } from "@/features/issues/components/issue-heatmap-map";
import {
  useIssueCategories,
  usePublicHeatmap,
} from "@/features/issues/hooks/use-public-issues";
import { useAuth } from "@/lib/auth/auth-provider";

type PublicIssueHeatmapScreenProps = Readonly<{
  locale: string;
}>;

const RANGE_OPTIONS = [30, 90, 180] as const;

export function PublicIssueHeatmapScreen({ locale }: PublicIssueHeatmapScreenProps) {
  void locale;
  const [selectedAreaKey, setSelectedAreaKey] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [days, setDays] = useState<number>(90);
  const { user } = useAuth();
  const categories = useIssueCategories();
  const heatmap = usePublicHeatmap({
    categoryId: categoryId || null,
    days,
    limit: 160,
  });

  const error = categories.error || heatmap.error;
  const selectedPoint =
    heatmap.data.find((point) => point.area_key === selectedAreaKey) ?? heatmap.data[0] ?? null;

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
          {publicIntelligenceCopy.eyebrow}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
          {publicIntelligenceCopy.title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          {publicIntelligenceCopy.description}
        </p>
        {user ? null : (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {publicIntelligenceCopy.sidebarBody}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-foreground">
            {publicIntelligenceCopy.filterCategory}
          </span>
          <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">{publicIntelligenceCopy.allCategories}</option>
            {categories.data.map((category) => (
              <option key={category.id} value={category.id}>
                {category.display_name}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-foreground">
            {publicIntelligenceCopy.filterRange}
          </span>
          <Select value={String(days)} onChange={(event) => setDays(Number(event.target.value))}>
            <option value={String(RANGE_OPTIONS[0])}>
              {publicIntelligenceCopy.timeRanges.last30}
            </option>
            <option value={String(RANGE_OPTIONS[1])}>
              {publicIntelligenceCopy.timeRanges.last90}
            </option>
            <option value={String(RANGE_OPTIONS[2])}>
              {publicIntelligenceCopy.timeRanges.last180}
            </option>
          </Select>
        </label>
      </div>

      {error ? <InlineMessage variant="error">{error}</InlineMessage> : null}

      {heatmap.data.length ? (
        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 p-3 shadow-soft backdrop-blur">
            <IssueHeatmapMap
              points={heatmap.data}
              selectedAreaKey={selectedAreaKey}
              onSelectPoint={setSelectedAreaKey}
              issueCountLabel={publicIntelligenceCopy.issueCount}
              secondaryLine={(point) =>
                "top_category_slug" in point && point.top_category_slug
                  ? point.top_category_slug
                  : null
              }
              heightClassName="h-[520px]"
            />
          </div>

          <aside className="rounded-[2rem] border border-border/70 bg-card/80 p-5 shadow-soft backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              {publicIntelligenceCopy.sidebarTitle}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {publicIntelligenceCopy.sidebarBody}
            </p>
            <div className="mt-4 grid gap-3">
              {heatmap.data.map((point) => (
                <button
                  key={point.area_key}
                  type="button"
                  onClick={() => setSelectedAreaKey(point.area_key)}
                  className="rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-3 text-left transition-colors hover:bg-background"
                >
                  <p className="font-semibold text-foreground">{point.label}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {point.issue_count} {publicIntelligenceCopy.issueCount}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {point.top_category_slug ?? publicIntelligenceCopy.topCategory}
                  </p>
                </button>
              ))}
            </div>
            {selectedPoint ? (
              <div className="mt-6 rounded-[1.5rem] border border-primary/10 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {publicIntelligenceCopy.selectedArea}
                </p>
                <p className="mt-3 font-display text-2xl font-semibold">
                  {selectedPoint.label}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {selectedPoint.issue_count} {publicIntelligenceCopy.issueCount}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {publicIntelligenceCopy.topCategory}:{" "}
                  {selectedPoint.top_category_slug ?? publicIntelligenceCopy.topCategory}
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      ) : (
        <EmptyState
          title={publicIntelligenceCopy.emptyTitle}
          body={publicIntelligenceCopy.emptyBody}
        />
      )}
    </section>
  );
}
