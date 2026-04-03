"use client";

import type { Route } from "next";
import Link from "next/link";
import { useId } from "react";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  Info,
  ListFilter,
  MoreHorizontal,
  RefreshCw,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveImage } from "@/components/ui/responsive-image";
import type { PublicIssueSummary, SwipeAction } from "@/lib/api/types";
import { useAppCopy } from "@/lib/i18n-provider";
import {
  formatCompactNumber,
  getIssueLocationSnippet,
  getIssueSignalLabel,
} from "@/features/issues/lib/presenters";

type SwipeDeckProps = Readonly<{
  issues: PublicIssueSummary[];
  listHref: Route;
  onAction: (action: SwipeAction) => void;
  onOpen: (issueId: string) => void;
  onRefresh: () => void;
}>;

function SwipeCard({
  issue,
  index,
  listHref,
  onAction,
  onOpen,
  onRefresh,
  shouldReduceMotion,
}: {
  issue: PublicIssueSummary;
  index: number;
  listHref: Route;
  onAction: (action: SwipeAction) => void;
  onOpen: (issueId: string) => void;
  onRefresh: () => void;
  shouldReduceMotion: boolean;
}) {
  const appCopy = useAppCopy();
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
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
      className="absolute inset-0"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-card/92 shadow-soft backdrop-blur">
        <div className="relative h-56 overflow-hidden border-b border-border/60 bg-muted/50">
          {issue.cover_image_url ? (
            <ResponsiveImage
              src={issue.cover_image_url}
              alt={issue.title}
              className="relative h-full w-full"
              sizes="(max-width: 768px) 100vw, 520px"
              priority={index === 0}
            />
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
              <details className="absolute right-4 top-4 z-10">
                <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-border/70 bg-background/88 text-foreground shadow-soft transition-colors hover:bg-card [&::-webkit-details-marker]:hidden">
                  <MoreHorizontal className="h-4 w-4" />
                </summary>
                <div className="absolute right-0 mt-2 w-56 rounded-[1.25rem] border border-border/70 bg-card/95 p-2 shadow-soft backdrop-blur">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.closest("details")?.removeAttribute("open");
                      onOpen(issue.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-[1rem] px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Info className="h-4 w-4" />
                    <span>{appCopy.discover.details}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.closest("details")?.removeAttribute("open");
                      onAction("more_like_this");
                    }}
                    className="flex w-full items-center gap-2 rounded-[1rem] px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <ChevronUp className="h-4 w-4" />
                    <span>{appCopy.discover.moreLikeThis}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.currentTarget.closest("details")?.removeAttribute("open");
                      onRefresh();
                    }}
                    className="flex w-full items-center gap-2 rounded-[1rem] px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>{appCopy.discover.refresh}</span>
                  </button>
                  <Link
                    href={listHref}
                    className="flex w-full items-center gap-2 rounded-[1rem] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <ListFilter className="h-4 w-4" />
                    <span>{appCopy.issueViews.listTab}</span>
                  </Link>
                </div>
              </details>
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
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-muted-foreground">
              <ArrowRightLeft className="h-4 w-4" />
              <span>{formatCompactNumber(issue.support_count)}</span>
            </div>
          </div>
        </div>
      </article>
    </motion.div>
  );
}

export function SwipeDeck({ issues, listHref, onAction, onOpen, onRefresh }: SwipeDeckProps) {
  const appCopy = useAppCopy();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const keyboardHintId = useId();
  const visibleIssues = issues.slice(0, 3);
  const activeIssue = issues[0];

  return (
    <section
      className="space-y-5"
      aria-describedby={keyboardHintId}
      onKeyDown={(event) => {
        if (!activeIssue) {
          return;
        }

        if (event.key === "ArrowRight") {
          event.preventDefault();
          onAction("support");
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onAction("skip");
        }
      }}
      tabIndex={0}
    >
      <div className="relative h-[640px]" aria-live="polite">
        <AnimatePresence initial={false}>
          {visibleIssues
            .map((issue, index) => ({ issue, index }))
            .reverse()
            .map(({ issue, index }) => (
              <SwipeCard
                key={issue.id}
                issue={issue}
                index={index}
                listHref={listHref}
                onAction={onAction}
                onOpen={onOpen}
                onRefresh={onRefresh}
                shouldReduceMotion={shouldReduceMotion}
              />
            ))}
        </AnimatePresence>
      </div>

      <p id={keyboardHintId} className="text-sm text-muted-foreground">
        {appCopy.discover.keyboardHint}
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
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
