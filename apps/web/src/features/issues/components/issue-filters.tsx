"use client";

import { LocateFixed } from "lucide-react";

import { Select } from "@/components/ui/select";
import { appCopy } from "@/content/copy";
import type { IssueCategory, PublicIssueSort } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type IssueFiltersProps = Readonly<{
  categories: IssueCategory[];
  sort: PublicIssueSort;
  categoryId: string | null;
  onSortChange: (sort: PublicIssueSort) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onRequestLocation?: () => void;
  isLocating?: boolean;
  locationError?: string | null;
  hideSort?: boolean;
}>;

const SORT_OPTIONS: PublicIssueSort[] = ["top", "recent", "nearby"];

export function IssueFilters({
  categories,
  sort,
  categoryId,
  onSortChange,
  onCategoryChange,
  onRequestLocation,
  isLocating = false,
  locationError,
  hideSort = false,
}: IssueFiltersProps) {
  const sortLabels: Record<PublicIssueSort, string> = {
    top: appCopy.issueViews.sortTop,
    recent: appCopy.issueViews.sortRecent,
    nearby: appCopy.issueViews.sortNearby,
  };

  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-card/80 p-4 shadow-soft backdrop-blur sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        {hideSort ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              {appCopy.issueViews.statusLabel}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {appCopy.issueViews.mapPanelBody}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              {appCopy.issueViews.sortLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSortChange(option)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                    sort === option
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/70 bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {sortLabels[option]}
                </button>
              ))}
            </div>
            {sort === "nearby" ? (
              <p className="text-sm leading-6 text-muted-foreground">
                {locationError || appCopy.issueViews.nearbyHint}
              </p>
            ) : null}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              {appCopy.issueViews.categoryLabel}
            </span>
            <Select
              value={categoryId ?? ""}
              onChange={(event) => onCategoryChange(event.target.value || null)}
            >
              <option value="">{appCopy.issueViews.allCategories}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.display_name}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              {appCopy.issueViews.statusLabel}
            </span>
            <Select value="published" disabled>
              <option value="published">{appCopy.issueViews.publishedOnly}</option>
            </Select>
          </label>
        </div>
      </div>

      {onRequestLocation ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={onRequestLocation}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <LocateFixed className="h-4 w-4" />
            <span>
              {isLocating ? appCopy.common.loading : appCopy.issueViews.useMyLocation}
            </span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
