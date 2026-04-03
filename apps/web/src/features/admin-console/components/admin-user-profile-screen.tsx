"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState, useTransition } from "react";

import { AuthRequiredCard } from "@/components/auth/auth-required-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { InlineMessage } from "@/components/ui/inline-message";
import { PageLoading } from "@/components/ui/page-loading";
import { Textarea } from "@/components/ui/textarea";
import { adminConsoleCopy } from "@/content/admin-console";
import {
  AdminKeyValueGrid,
  AdminMetricCard,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminSurface,
} from "@/features/admin-console/components/admin-primitives";
import { useAdminUserProfile } from "@/features/admin-console/hooks/use-admin-console";
import {
  formatAbuseRiskLabel,
  formatIssueDate,
  formatIssueStatus,
  formatLifecycleLabel,
  formatMetricValue,
  formatSeverity,
  formatStatusTone,
} from "@/features/admin-console/lib/presenters";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";

type AdminUserProfileScreenProps = Readonly<{
  locale: string;
  userId: string;
}>;

function formatFactorDetails(details: Record<string, unknown>) {
  const entries = Object.entries(details).map(
    ([key, value]) => `${key}: ${formatMetricValue(value)}`,
  );
  return entries.length ? entries.join(" · ") : adminConsoleCopy.common.noData;
}

export function AdminUserProfileScreen({
  locale,
  userId,
}: AdminUserProfileScreenProps) {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const detail = useAdminUserProfile(token, Boolean(isAdmin), userId);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!user) {
    return <AuthRequiredCard locale={locale} />;
  }

  if (!isAdmin) {
    return <InlineMessage variant="error">{adminConsoleCopy.common.adminOnly}</InlineMessage>;
  }

  function setActive(active: boolean) {
    if (!token) {
      return;
    }

    startTransition(async () => {
      try {
        const nextDetail = active
          ? await apiClient.unbanAdminUser(token, userId, { note: note || null })
          : await apiClient.banAdminUser(token, userId, { note: note || null });
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
        title={adminConsoleCopy.users.profileTitle}
        body={adminConsoleCopy.users.emptyBody}
      />
    );
  }

  const current = detail.data;

  return (
    <section className="space-y-6">
      <AdminSurface>
        <AdminSectionHeader
          eyebrow={adminConsoleCopy.users.eyebrow}
          title={current.identity.full_name}
          body={adminConsoleCopy.users.description}
          action={
            <Button asChild variant="outline">
              <Link href={`/${locale}/admin/users` as Route}>
                {adminConsoleCopy.common.backToUsers}
              </Link>
            </Button>
          }
        />
        <div className="mt-6 flex flex-wrap gap-2">
          <AdminStatusBadge
            label={current.identity.role}
            tone={current.identity.role === "admin" ? "primary" : "subtle"}
          />
          {current.integrity ? (
            <AdminStatusBadge
              label={formatAbuseRiskLabel(current.integrity.abuse_risk_level)}
              tone={formatStatusTone(current.integrity.abuse_risk_level)}
            />
          ) : null}
          <AdminStatusBadge
            label={
              current.identity.is_active
                ? adminConsoleCopy.common.active
                : adminConsoleCopy.common.banned
            }
            tone={current.identity.is_active ? "primary" : "accent"}
          />
        </div>
      </AdminSurface>

      {message ? <InlineMessage variant="info">{message}</InlineMessage> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label={adminConsoleCopy.users.trustScoreLabel}
          value={current.integrity ? current.integrity.trust_score.toFixed(1) : "0.0"}
        />
        <AdminMetricCard
          label={adminConsoleCopy.users.abuseRiskLabel}
          value={current.integrity ? current.integrity.abuse_risk_score.toFixed(1) : "0.0"}
          tone="accent"
        />
        <AdminMetricCard
          label={adminConsoleCopy.users.metricsTitle}
          value={current.integrity ? String(current.integrity.sanction_count) : "0"}
        />
        <AdminMetricCard
          label={adminConsoleCopy.users.reactionsTitle}
          value={String(current.reaction_patterns.reduce((sum, item) => sum + item.count, 0))}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.users.profileTitle} />
            <div className="mt-6">
              <AdminKeyValueGrid
                columns={2}
                items={[
                  {
                    label: adminConsoleCopy.users.emailLabel,
                    value: current.identity.email,
                  },
                  {
                    label: adminConsoleCopy.users.localeLabel,
                    value: current.identity.preferred_locale,
                  },
                  {
                    label: adminConsoleCopy.users.activeLabel,
                    value: current.identity.is_active
                      ? adminConsoleCopy.common.yes
                      : adminConsoleCopy.common.no,
                  },
                  {
                    label: adminConsoleCopy.users.lastLoginLabel,
                    value: current.identity.last_login_at
                      ? formatIssueDate(current.identity.last_login_at)
                      : adminConsoleCopy.common.noData,
                  },
                ]}
              />
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.users.recommendedActionsTitle} />
            <div className="mt-6 grid gap-3">
              {current.recommended_actions.length ? (
                current.recommended_actions.map((action) => (
                  <div
                    key={action}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                  >
                    {action}
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  {adminConsoleCopy.users.emptyHistory}
                </p>
              )}
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.users.eventsTitle} />
            <div className="mt-6 grid gap-3">
              {current.recent_events.length ? (
                current.recent_events.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge
                        label={formatSeverity(event.severity)}
                        tone={formatStatusTone(event.severity)}
                      />
                      <AdminStatusBadge label={event.event_type} tone="subtle" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-200">{event.summary}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {formatIssueDate(event.created_at)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  {adminConsoleCopy.users.emptyHistory}
                </p>
              )}
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.users.noteLabel} />
            <div className="mt-6 grid gap-4">
              <Field label={adminConsoleCopy.users.noteLabel}>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending || current.identity.is_active}
                  onClick={() => setActive(true)}
                >
                  {adminConsoleCopy.users.unbanAction}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isPending || !current.identity.is_active}
                  onClick={() => setActive(false)}
                >
                  {adminConsoleCopy.users.banAction}
                </Button>
              </div>
            </div>
          </AdminSurface>
        </div>

        <div className="space-y-6">
          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.users.trustFactorsTitle} />
            <div className="mt-6 grid gap-3">
              {current.trust_factors.length ? (
                current.trust_factors.map((factor) => (
                  <article
                    key={factor.name}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge label={factor.label} tone="primary" />
                      {typeof factor.points === "number" ? (
                        <AdminStatusBadge label={factor.points.toFixed(2)} tone="subtle" />
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {formatFactorDetails(factor.details)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  {adminConsoleCopy.users.emptyHistory}
                </p>
              )}
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.users.abuseFactorsTitle} />
            <div className="mt-6 grid gap-3">
              {current.abuse_factors.length ? (
                current.abuse_factors.map((factor) => (
                  <article
                    key={factor.name}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge
                        label={factor.label}
                        tone={factor.effect === "risk" ? "accent" : "subtle"}
                      />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {formatFactorDetails(factor.details)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  {adminConsoleCopy.users.emptyHistory}
                </p>
              )}
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.users.submissionsTitle} />
            <div className="mt-6 grid gap-3">
              {current.recent_issues.length ? (
                current.recent_issues.map((issue) => (
                  <article
                    key={issue.id}
                    className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge
                        label={formatIssueStatus(issue.status)}
                        tone={formatStatusTone(issue.status)}
                      />
                      <AdminStatusBadge
                        label={formatLifecycleLabel(issue.moderation_state)}
                        tone={formatStatusTone(issue.moderation_state)}
                      />
                    </div>
                    <p className="mt-3 font-semibold text-white">{issue.title}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {formatIssueDate(issue.created_at)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-300">
                  {adminConsoleCopy.users.emptyHistory}
                </p>
              )}
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.users.reactionsTitle} />
            <div className="mt-6">
              <AdminKeyValueGrid
                columns={2}
                items={
                  current.reaction_patterns.length
                    ? current.reaction_patterns.map((pattern) => ({
                        label: pattern.action,
                        value: String(pattern.count),
                      }))
                    : [
                        {
                          label: adminConsoleCopy.common.noData,
                          value: adminConsoleCopy.users.emptyHistory,
                        },
                      ]
                }
              />
            </div>
          </AdminSurface>
        </div>
      </div>
    </section>
  );
}
