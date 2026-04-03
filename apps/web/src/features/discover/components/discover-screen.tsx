"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ListFilter, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineMessage } from "@/components/ui/inline-message";
import { appCopy } from "@/content/copy";
import { SwipeDeck } from "@/features/discover/components/swipe-deck";
import { IssueDetailsSheet } from "@/features/issues/components/issue-details-sheet";
import { IssueFilters } from "@/features/issues/components/issue-filters";
import {
  useIssueCategories,
  useSwipeFeed,
} from "@/features/issues/hooks/use-public-issues";
import { useUserLocation } from "@/hooks/use-user-location";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";
import type { PublicIssueSort, PublicIssueSummary, SwipeAction } from "@/lib/api/types";

type DiscoverScreenProps = Readonly<{
  locale: string;
}>;

export function DiscoverScreen({ locale }: DiscoverScreenProps) {
  const [sort, setSort] = useState<PublicIssueSort>("top");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [deck, setDeck] = useState<PublicIssueSummary[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const categories = useIssueCategories();
  const { token } = useAuth();
  const { location, isLoading: isLocating, error: locationError, requestLocation } =
    useUserLocation();
  const feed = useSwipeFeed({
    sort,
    categoryId,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    limit: 12,
    excludeIssueIds: dismissedIds,
  });

  useEffect(() => {
    setDeck(feed.data);
  }, [feed.data]);

  async function handleAction(action: SwipeAction) {
    const issue = deck[0];
    if (!issue) {
      return;
    }

    setDeck((current) => current.slice(1));
    setDismissedIds((current) => [...current, issue.id].slice(-40));

    if (!token) {
      setFeedbackMessage(appCopy.discover.localActionOnly);
      return;
    }

    try {
      await apiClient.sendIssueFeedback(token, issue.id, action);
      setFeedbackMessage(appCopy.discover.savedAction);
      if (action === "support") {
        feed.reload();
      }
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : appCopy.issueViews.errorTitle);
    }
  }

  function handleRefresh() {
    setDismissedIds([]);
    setFeedbackMessage(appCopy.discover.refreshed);
    feed.reload();
  }

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
              {appCopy.discover.stackTitle}
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
              {appCopy.discover.title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {appCopy.discover.subtitle}
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {appCopy.discover.stackBody}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href={`/${locale}/issues` as Route}>
                  <ListFilter className="mr-2 h-4 w-4" />
                  {appCopy.issueViews.listTab}
                </Link>
              </Button>
              <Button type="button" variant="outline" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {appCopy.discover.refresh}
              </Button>
            </div>
          </div>

          <IssueFilters
            categories={categories.data}
            sort={sort}
            categoryId={categoryId}
            onSortChange={setSort}
            onCategoryChange={setCategoryId}
            onRequestLocation={requestLocation}
            isLocating={isLocating}
            locationError={locationError}
          />

          {!token ? (
            <InlineMessage variant="info">{appCopy.discover.noAuthBody}</InlineMessage>
          ) : null}
          {feedbackMessage ? (
            <InlineMessage
              variant={
                feedbackMessage === appCopy.discover.savedAction ||
                feedbackMessage === appCopy.discover.refreshed
                  ? "success"
                  : "info"
              }
            >
              {feedbackMessage}
            </InlineMessage>
          ) : null}
          {categories.error || feed.error ? (
            <InlineMessage variant="error">
              {appCopy.issueViews.errorTitle} {categories.error || feed.error}
            </InlineMessage>
          ) : null}
        </div>

        <div className="min-w-0">
          {feed.isLoading && !deck.length ? (
            <div className="h-[640px] animate-pulse rounded-[2rem] border border-border/70 bg-card/80 shadow-soft" />
          ) : deck.length ? (
            <SwipeDeck issues={deck} onAction={handleAction} onOpen={setSelectedIssueId} />
          ) : (
            <EmptyState
              title={appCopy.discover.deckEmptyTitle}
              body={appCopy.discover.deckEmptyBody}
              action={
                <Button type="button" onClick={handleRefresh}>
                  {appCopy.discover.refresh}
                </Button>
              }
            />
          )}
        </div>
      </section>

      <IssueDetailsSheet
        locale={locale}
        issueId={selectedIssueId}
        isOpen={Boolean(selectedIssueId)}
        onClose={() => setSelectedIssueId(null)}
        onFeedbackSaved={feed.reload}
      />
    </>
  );
}
