"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState, useTransition } from "react";

import { AuthRequiredCard } from "@/components/auth/auth-required-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { InlineMessage } from "@/components/ui/inline-message";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/ui/page-loading";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminKeyValueGrid,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminSurface,
} from "@/features/admin-console/components/admin-primitives";
import { useAdminIssueDetail } from "@/features/admin-console/hooks/use-admin-console";
import {
  formatCompactNumber,
  formatIssueDate,
  formatIssueStatus,
  formatLifecycleLabel,
  formatMetricValue,
  formatStatusTone,
} from "@/features/admin-console/lib/presenters";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { useAdminCopy } from "@/lib/i18n-provider";

type AdminIssueDetailScreenProps = Readonly<{
  locale: string;
  issueId: string;
}>;

const ISSUE_ACTIONS = [
  "approve",
  "reject",
  "publish",
  "archive",
  "reopen",
] as const;

export function AdminIssueDetailScreen({
  locale,
  issueId,
}: AdminIssueDetailScreenProps) {
  const adminConsoleCopy = useAdminCopy();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const detail = useAdminIssueDetail(token, Boolean(isAdmin), issueId);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [duplicateCanonicalId, setDuplicateCanonicalId] = useState("");
  const [duplicateReason, setDuplicateReason] = useState("");
  const [archiveDuplicate, setArchiveDuplicate] = useState(true);
  const [bypassAi, setBypassAi] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!user) {
    return <AuthRequiredCard locale={locale} />;
  }

  if (!isAdmin) {
    return <InlineMessage variant="error">{adminConsoleCopy.common.adminOnly}</InlineMessage>;
  }

  async function runAction(action: (typeof ISSUE_ACTIONS)[number]) {
    if (!token) {
      return;
    }

    startTransition(async () => {
      try {
        const nextDetail = await apiClient.applyAdminIssueAction(token, issueId, {
          action,
          note: note || null,
          bypass_ai: bypassAi,
        });
        detail.setData(nextDetail);
        setMessage(adminConsoleCopy.common.successSaved);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : adminConsoleCopy.common.noData);
      }
    });
  }

  function linkDuplicate() {
    if (!token || !duplicateCanonicalId.trim()) {
      return;
    }

    startTransition(async () => {
      try {
        const nextDetail = await apiClient.linkAdminIssueDuplicate(token, issueId, {
          canonical_issue_id: duplicateCanonicalId.trim(),
          reason_breakdown: duplicateReason
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
          archive_duplicate: archiveDuplicate,
        });
        detail.setData(nextDetail);
        setMessage(adminConsoleCopy.common.successSaved);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : adminConsoleCopy.common.noData);
      }
    });
  }

  if (detail.isLoading) {
    return <PageLoading title={adminConsoleCopy.common.loading} />;
  }

  if (detail.error) {
    return <InlineMessage variant="error">{detail.error}</InlineMessage>;
  }

  if (!detail.data) {
    return (
      <EmptyState
        title={adminConsoleCopy.issues.detailTitle}
        body={adminConsoleCopy.common.noSelection}
      />
    );
  }

  const current = detail.data;

  return (
    <section className="space-y-6">
      <AdminSurface>
        <AdminSectionHeader
          eyebrow={adminConsoleCopy.issues.eyebrow}
          title={current.issue.title}
          body={current.issue.short_description}
          action={
            <Button asChild variant="outline">
              <Link href={`/${locale}/admin/issues` as Route}>
                {adminConsoleCopy.common.backToIssues}
              </Link>
            </Button>
          }
        />
        <div className="mt-6 flex flex-wrap gap-2">
          <AdminStatusBadge label={current.issue.category.display_name} tone="primary" />
          <AdminStatusBadge
            label={formatIssueStatus(current.issue.status)}
            tone={formatStatusTone(current.issue.status)}
          />
          <AdminStatusBadge
            label={formatLifecycleLabel(current.issue.moderation_state)}
            tone={formatStatusTone(current.issue.moderation_state)}
          />
        </div>
        <div className="mt-6">
          <AdminKeyValueGrid
            columns={4}
            items={[
              {
                label: adminConsoleCopy.heatmap.averageImpact,
                value:
                  typeof current.issue.public_impact_score === "number"
                    ? `${current.issue.public_impact_score.toFixed(1)}/10`
                    : adminConsoleCopy.common.noData,
              },
              {
                label: adminConsoleCopy.issues.supportMetricsTitle,
                value: current.support_metrics.trust_weighted_support_total.toFixed(2),
              },
              {
                label: adminConsoleCopy.heatmap.issueCount,
                value: formatCompactNumber(current.support_metrics.support_count),
              },
              {
                label: adminConsoleCopy.common.locationLabel,
                value: current.issue.location_snippet,
              },
            ]}
          />
        </div>
      </AdminSurface>

      {message ? <InlineMessage variant="info">{message}</InlineMessage> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.issues.actionsTitle} />
            <div className="mt-6 flex flex-wrap gap-3">
              {ISSUE_ACTIONS.map((action) => (
                <Button
                  key={action}
                  type="button"
                  variant={action === "publish" ? "secondary" : "outline"}
                  disabled={isPending}
                  onClick={() => runAction(action)}
                >
                  {adminConsoleCopy.issues[
                    `${action}Action` as
                      | "approveAction"
                      | "rejectAction"
                      | "publishAction"
                      | "archiveAction"
                      | "reopenAction"
                  ]}
                </Button>
              ))}
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.3fr]">
              <Field label={adminConsoleCopy.issues.noteLabel}>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                />
              </Field>
              <label className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={bypassAi}
                  onChange={(event) => setBypassAi(event.target.checked)}
                />
                <span>{adminConsoleCopy.issues.bypassAiLabel}</span>
              </label>
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.issues.impactTitle} />
            <div className="mt-6 grid gap-3">
              {current.impact.factors.map((factor) => (
                <article
                  key={factor.name}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge label={factor.label} tone="primary" />
                    <AdminStatusBadge label={factor.weight.toFixed(2)} tone="subtle" />
                    <AdminStatusBadge
                      label={factor.contribution.toFixed(2)}
                      tone={factor.contribution >= 0 ? "primary" : "accent"}
                    />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {adminConsoleCopy.common.signal}
                      </p>
                      <p className="mt-2 text-sm text-slate-100">{factor.signal.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {adminConsoleCopy.common.rawValue}
                      </p>
                      <p className="mt-2 text-sm text-slate-100">
                        {formatMetricValue(factor.raw_value, adminConsoleCopy.common)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {adminConsoleCopy.common.details}
                      </p>
                      <p className="mt-2 text-sm text-slate-100">
                        {Object.keys(factor.details).length
                          ? Object.entries(factor.details)
                              .map(([key, value]) => `${key}: ${formatMetricValue(value, adminConsoleCopy.common)}`)
                              .join(" · ")
                          : adminConsoleCopy.common.noData}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.issues.moderationTitle} />
            <div className="mt-6 grid gap-4">
              {current.moderation_results.length ? (
                current.moderation_results.map((result) => (
                  <article
                    key={result.id}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge label={result.layer} tone="primary" />
                      <AdminStatusBadge
                        label={result.status}
                        tone={formatStatusTone(result.status)}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-200">
                      {result.summary ?? adminConsoleCopy.common.noData}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {result.user_safe_explanation ?? adminConsoleCopy.common.noData}
                    </p>
                    {result.machine_reasons.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {result.machine_reasons.map((reason) => (
                          <AdminStatusBadge
                            key={`${result.id}-${reason.code}`}
                            label={reason.label}
                            tone={reason.severity === "high" ? "accent" : "subtle"}
                          />
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  {adminConsoleCopy.common.noData}
                </p>
              )}
            </div>
          </AdminSurface>
        </div>

        <div className="space-y-6">
          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.issues.supportMetricsTitle} />
            <div className="mt-6">
              <AdminKeyValueGrid
                columns={2}
                items={[
                  {
                    label: adminConsoleCopy.common.support,
                    value: formatCompactNumber(current.support_metrics.support_count),
                  },
                  {
                    label: adminConsoleCopy.common.skip,
                    value: formatCompactNumber(current.support_metrics.skip_count),
                  },
                  {
                    label: adminConsoleCopy.common.moreLikeThis,
                    value: formatCompactNumber(
                      current.support_metrics.more_like_this_count,
                    ),
                  },
                  {
                    label: adminConsoleCopy.common.lessLikeThis,
                    value: formatCompactNumber(
                      current.support_metrics.less_like_this_count,
                    ),
                  },
                ]}
              />
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.issues.attachmentsTitle} />
            <div className="mt-6 grid gap-3">
              {current.attachments.length ? (
                current.attachments.map((attachment) => (
                  <article
                    key={attachment.id}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                  >
                    <p className="font-semibold text-white">{attachment.original_filename}</p>
                    <p className="mt-2 text-sm text-slate-300">{attachment.content_type}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {formatCompactNumber(attachment.size_bytes)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  {adminConsoleCopy.issues.noAttachments}
                </p>
              )}
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.issues.duplicatesTitle} />
            <div className="mt-6 space-y-3">
              {[...current.canonical_duplicates, ...current.duplicate_of].length ? (
                [...current.canonical_duplicates, ...current.duplicate_of].map((link) => (
                  <article
                    key={link.id}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge
                        label={link.status}
                        tone={formatStatusTone(link.status)}
                      />
                      {typeof link.similarity_score === "number" ? (
                        <AdminStatusBadge
                          label={link.similarity_score.toFixed(2)}
                          tone="primary"
                        />
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-200">
                      {link.canonical_issue_title ??
                        link.duplicate_issue_title ??
                        adminConsoleCopy.common.noData}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {link.reason_breakdown.length
                        ? link.reason_breakdown.join(" · ")
                        : adminConsoleCopy.common.noData}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  {adminConsoleCopy.issues.noDuplicates}
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-4">
              <Field label={adminConsoleCopy.issues.canonicalIssueLabel}>
                <Input
                  value={duplicateCanonicalId}
                  onChange={(event) => setDuplicateCanonicalId(event.target.value)}
                />
              </Field>
              <Field label={adminConsoleCopy.issues.reasonLabel}>
                <Textarea
                  value={duplicateReason}
                  onChange={(event) => setDuplicateReason(event.target.value)}
                  rows={4}
                />
              </Field>
              <label className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={archiveDuplicate}
                  onChange={(event) => setArchiveDuplicate(event.target.checked)}
                />
                <span>{adminConsoleCopy.issues.archiveDuplicateLabel}</span>
              </label>
              <Button type="button" variant="secondary" disabled={isPending} onClick={linkDuplicate}>
                {adminConsoleCopy.issues.linkDuplicateAction}
              </Button>
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.issues.auditTitle} />
            <div className="mt-6 space-y-3">
              {current.admin_actions.length ? (
                current.admin_actions.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge label={entry.action} tone="primary" />
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {formatIssueDate(entry.created_at)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm text-slate-200">
                      {entry.admin?.full_name ?? adminConsoleCopy.common.noData}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {entry.note ?? adminConsoleCopy.common.noData}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  {adminConsoleCopy.issues.noActions}
                </p>
              )}
            </div>
          </AdminSurface>
        </div>
      </div>
    </section>
  );
}
