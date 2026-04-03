"use client";

import type { Route } from "next";
import Link from "next/link";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineMessage } from "@/components/ui/inline-message";
import { IssueDetailsContent } from "@/features/issues/components/issue-details-content";
import { usePublicIssueDetail } from "@/features/issues/hooks/use-public-issues";
import { useAppCopy } from "@/lib/i18n-provider";

type PublicIssueDetailScreenProps = Readonly<{
  locale: string;
  issueId: string;
}>;

export function PublicIssueDetailScreen({
  locale,
  issueId,
}: PublicIssueDetailScreenProps) {
  const appCopy = useAppCopy();
  const issue = usePublicIssueDetail(issueId, true);

  return (
    <section className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/${locale}/issues` as Route}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {appCopy.issueViews.detailBack}
        </Link>
      </Button>

      {issue.isLoading ? (
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-[2rem] bg-muted" />
          <div className="h-6 w-1/3 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted" />
        </div>
      ) : issue.error ? (
        <InlineMessage variant="error">{issue.error}</InlineMessage>
      ) : issue.data ? (
        <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur sm:p-8">
          <IssueDetailsContent issue={issue.data} locale={locale} />
        </div>
      ) : (
        <EmptyState
          title={appCopy.issueViews.emptyTitle}
          body={appCopy.issueViews.emptyBody}
        />
      )}
    </section>
  );
}
