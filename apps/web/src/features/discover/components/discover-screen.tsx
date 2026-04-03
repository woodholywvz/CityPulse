"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ListFilter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineMessage } from "@/components/ui/inline-message";
import { SwipeDeck } from "@/features/discover/components/swipe-deck";
import { IssueDetailsSheet } from "@/features/issues/components/issue-details-sheet";
import { useSwipeFeed } from "@/features/issues/hooks/use-public-issues";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { useAppCopy } from "@/lib/i18n-provider";
import type { PublicIssueSummary, SwipeAction } from "@/lib/api/types";

type DiscoverScreenProps = Readonly<{
  locale: string;
}>;

export function DiscoverScreen({ locale }: DiscoverScreenProps) {
  const appCopy = useAppCopy();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [deck, setDeck] = useState<PublicIssueSummary[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const { token } = useAuth();
  const feed = useSwipeFeed({
    sort: "top",
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
      <section className="mx-auto max-w-3xl space-y-5">
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
        {feed.error ? (
          <InlineMessage variant="error">
            {appCopy.issueViews.errorTitle} {feed.error}
          </InlineMessage>
        ) : null}

        {feed.isLoading && !deck.length ? (
          <div className="h-[640px] animate-pulse rounded-[2rem] border border-border/70 bg-card/80 shadow-soft" />
        ) : deck.length ? (
          <SwipeDeck
            issues={deck}
            listHref={`/${locale}/issues` as Route}
            onAction={handleAction}
            onOpen={setSelectedIssueId}
            onRefresh={handleRefresh}
          />
        ) : (
          <EmptyState
            title={appCopy.discover.deckEmptyTitle}
            body={appCopy.discover.deckEmptyBody}
            action={
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={handleRefresh}>
                  {appCopy.discover.refresh}
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/${locale}/issues` as Route}>
                    <ListFilter className="mr-2 h-4 w-4" />
                    {appCopy.issueViews.listTab}
                  </Link>
                </Button>
              </div>
            }
          />
        )}
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
