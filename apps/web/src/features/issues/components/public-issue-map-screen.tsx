"use client";

import { useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { InlineMessage } from "@/components/ui/inline-message";
import { appCopy } from "@/content/copy";
import { IssueDetailsSheet } from "@/features/issues/components/issue-details-sheet";
import { IssueFilters } from "@/features/issues/components/issue-filters";
import { IssueMap } from "@/features/issues/components/issue-map";
import {
  useIssueCategories,
  useMapIssues,
} from "@/features/issues/hooks/use-public-issues";
import { formatCompactNumber } from "@/features/issues/lib/presenters";
import { useUserLocation } from "@/hooks/use-user-location";

type PublicIssueMapScreenProps = Readonly<{
  locale: string;
}>;

export function PublicIssueMapScreen({ locale }: PublicIssueMapScreenProps) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const categories = useIssueCategories();
  const { location, isLoading: isLocating, error: locationError, requestLocation } =
    useUserLocation();
  const markers = useMapIssues({
    categoryId,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    limit: 90,
  });

  const isLoading = categories.isLoading || markers.isLoading;
  const error = categories.error || markers.error;

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
            {appCopy.issueViews.mapEyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
            {appCopy.issueViews.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            {appCopy.issueViews.mapPanelBody}
          </p>
        </div>

        <IssueFilters
          categories={categories.data}
          sort="recent"
          categoryId={categoryId}
          onSortChange={() => undefined}
          onCategoryChange={setCategoryId}
          onRequestLocation={requestLocation}
          isLocating={isLocating}
          locationError={locationError}
          hideSort
        />

        {error ? (
          <InlineMessage variant="error">
            {appCopy.issueViews.errorTitle} {error}
          </InlineMessage>
        ) : null}

        {isLoading ? (
          <div className="h-[420px] animate-pulse rounded-[2rem] border border-border/70 bg-card/80 shadow-soft" />
        ) : markers.data.length ? (
          <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
            <div className="rounded-[2rem] border border-border/70 bg-card/80 p-3 shadow-soft backdrop-blur">
              <IssueMap
                markers={markers.data}
                selectedIssueId={selectedIssueId}
                userLocation={location}
                onSelectIssue={setSelectedIssueId}
                heightClassName="h-[480px]"
              />
            </div>

            <aside className="rounded-[2rem] border border-border/70 bg-card/80 p-5 shadow-soft backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                {appCopy.issueViews.mapPanelTitle}
              </p>
              <div className="mt-4 space-y-3">
                {markers.data.map((marker) => (
                  <button
                    key={marker.id}
                    type="button"
                    onClick={() => setSelectedIssueId(marker.id)}
                    className="block w-full rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-3 text-left transition-colors hover:bg-background"
                  >
                    <p className="font-semibold text-foreground">{marker.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {marker.category.display_name}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {formatCompactNumber(marker.support_count)} {appCopy.issueViews.supportCountLabel}
                    </p>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        ) : (
          <EmptyState
            title={appCopy.issueViews.emptyTitle}
            body={appCopy.issueViews.emptyBody}
          />
        )}
      </section>

      <IssueDetailsSheet
        locale={locale}
        issueId={selectedIssueId}
        isOpen={Boolean(selectedIssueId)}
        onClose={() => setSelectedIssueId(null)}
        onFeedbackSaved={markers.reload}
      />
    </>
  );
}
