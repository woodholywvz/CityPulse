/* eslint-disable @next/next/no-img-element */

"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  Info,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/content/copy";
import type { PublicIssueSummary, SwipeAction } from "@/lib/api/types";
import {
  formatCompactNumber,
  getIssueLocationSnippet,
  getIssueSignalLabel,
} from "@/features/issues/lib/presenters";

type SwipeDeckProps = Readonly<{
  issues: PublicIssueSummary[];
  onAction: (action: SwipeAction) => void;
  onOpen: (issueId: string) => void;
}>;

function SwipeCard({
  issue,
  index,
  onAction,
  onOpen,
}: {
  issue: PublicIssueSummary;
  index: number;
  onAction: (action: SwipeAction) => void;
  onOpen: (issueId: string) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-10, 0, 10]);
  const supportOpacity = useTransform(x, [40, 140], [0, 1]);
  const skipOpacity = useTransform(x, [-140, -40], [1, 0]);

  return (
    <motion.div
      drag={index === 0 ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x >= 120) {
          onAction("support");
        } else if (info.offset.x <= -120) {
          onAction("skip");
        }
      }}
      style={index === 0 ? { x, rotate } : undefined}
      animate={{
        scale: 1 - index * 0.04,
        y: index * 14,
        opacity: 1 - index * 0.08,
      }}
      exit={{
        opacity: 0,
        scale: 0.92,
        y: -40,
      }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="absolute inset-0"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-card/92 shadow-soft backdrop-blur">
        <div className="relative h-56 overflow-hidden border-b border-border/60 bg-muted/50">
          {issue.cover_image_url ? (
            <img src={issue.cover_image_url} alt={issue.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col justify-between bg-gradient-to-br from-secondary via-card to-accent/70 p-5">
              <Badge variant="primary">{issue.category.display_name}</Badge>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {appCopy.issueViews.noImage}
                </p>
                <p className="mt-2 max-w-sm font-display text-2xl font-semibold">
                  {issue.title}
                </p>
              </div>
            </div>
          )}

          {index === 0 ? (
            <>
              <motion.div
                style={{ opacity: supportOpacity }}
                className="absolute left-4 top-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-200"
              >
                {appCopy.discover.support}
              </motion.div>
              <motion.div
                style={{ opacity: skipOpacity }}
                className="absolute right-4 top-4 rounded-full border border-slate-900/20 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-50"
              >
                {appCopy.discover.skip}
              </motion.div>
            </>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="subtle">{issue.category.display_name}</Badge>
            <Badge variant="accent">{getIssueSignalLabel(issue)}</Badge>
          </div>

          <div className="mt-4">
            <h2 className="font-display text-2xl font-semibold">{issue.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {issue.short_description}
            </p>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div>{getIssueLocationSnippet(issue)}</div>
            <div>
              {formatCompactNumber(issue.support_count)} {appCopy.issueViews.supportCountLabel}
            </div>
          </div>

          <div className="mt-auto pt-6">
            <Button type="button" variant="outline" onClick={() => onOpen(issue.id)}>
              <Info className="mr-2 h-4 w-4" />
              {appCopy.discover.details}
            </Button>
          </div>
        </div>
      </article>
    </motion.div>
  );
}

export function SwipeDeck({ issues, onAction, onOpen }: SwipeDeckProps) {
  const visibleIssues = issues.slice(0, 3);
  const activeIssue = issues[0];

  return (
    <section className="space-y-5">
      <div className="relative h-[640px]">
        <AnimatePresence initial={false}>
          {visibleIssues
            .map((issue, index) => ({ issue, index }))
            .reverse()
            .map(({ issue, index }) => (
              <SwipeCard
                key={issue.id}
                issue={issue}
                index={index}
                onAction={onAction}
                onOpen={onOpen}
              />
            ))}
        </AnimatePresence>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onAction("skip")}
          disabled={!activeIssue}
        >
          <X className="mr-2 h-4 w-4" />
          {appCopy.discover.skip}
        </Button>
        <Button type="button" onClick={() => onAction("support")} disabled={!activeIssue}>
          <HeartHandshake className="mr-2 h-4 w-4" />
          {appCopy.discover.support}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onAction("more_like_this")}
          disabled={!activeIssue}
        >
          <ChevronUp className="mr-2 h-4 w-4" />
          {appCopy.discover.moreLikeThis}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onAction("less_like_this")}
          disabled={!activeIssue}
        >
          <ChevronDown className="mr-2 h-4 w-4" />
          {appCopy.discover.lessLikeThis}
        </Button>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-muted-foreground">
        <ArrowRightLeft className="h-4 w-4" />
        <span>{issues.length}</span>
      </div>
    </section>
  );
}
