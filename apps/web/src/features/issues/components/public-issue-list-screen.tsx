"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { Map } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { InlineMessage } from "@/components/ui/inline-message";
import { PageLoading } from "@/components/ui/page-loading";
import { Button } from "@/components/ui/button";
import { IssueCard } from "@/features/issues/components/issue-card";
import { IssueDetailsSheet } from "@/features/issues/components/issue-details-sheet";
import { IssueFilters } from "@/features/issues/components/issue-filters";
import {
  useIssueCategories,
  usePublicIssues,
} from "@/features/issues/hooks/use-public-issues";
import { useUserLocation } from "@/hooks/use-user-location";
import { useAppCopy } from "@/lib/i18n-provider";
import type { PublicIssueSort, PublicIssueStatus } from "@/lib/api/types";

type PublicIssueListScreenProps = Readonly<{
  locale: string;
}>;

export function PublicIssueListScreen({ locale }: PublicIssueListScreenProps) {
  const appCopy = useAppCopy();
  const [sort, setSort] = useState<PublicIssueSort>("top");
  const [status, setStatus] = useState<PublicIssueStatus>("published");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const categories = useIssueCategories();
  const { location, isLoading: isLocating, error: locationError, requestLocation } =
    useUserLocation();
  const issues = usePublicIssues({
    sort,
    status,
    categoryId,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    limit: 18,
  });

  const isLoading = categories.isLoading || issues.isLoading;
  const error = categories.error || issues.error;

  return (
    <>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
              {appCopy.issueViews.listEyebrow}
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
              {appCopy.issueViews.title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {appCopy.issueViews.subtitle}
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href={`/${locale}/issues/map` as Route}>
              <Map className="mr-2 h-4 w-4" />
              {appCopy.issueViews.mapTab}
            </Link>
          </Button>
        </div>

        <IssueFilters
          categories={categories.data}
          sort={sort}
          status={status}
          categoryId={categoryId}
          onSortChange={setSort}
          onStatusChange={setStatus}
          onCategoryChange={setCategoryId}
          onRequestLocation={requestLocation}
          isLocating={isLocating}
          locationError={locationError}
        />

        {error ? (
          <InlineMessage variant="error">
            {appCopy.issueViews.errorTitle} {error}
          </InlineMessage>
        ) : null}

        {isLoading ? (
          <PageLoading title={appCopy.issueViews.loadingTitle} />
        ) : issues.data.length ? (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {issues.data.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onOpen={setSelectedIssueId} />
            ))}
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
        onFeedbackSaved={issues.reload}
      />
    </>
  );
}
