"use client";

import type { Route } from "next";
import Link from "next/link";

import { AuthRequiredCard } from "@/components/auth/auth-required-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineMessage } from "@/components/ui/inline-message";
import { PageLoading } from "@/components/ui/page-loading";
import { adminConsoleCopy } from "@/content/admin-console";
import {
  AdminMetricCard,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminSurface,
} from "@/features/admin-console/components/admin-primitives";
import { useAdminUsers } from "@/features/admin-console/hooks/use-admin-console";
import {
  formatAbuseRiskLabel,
  formatCompactNumber,
  formatIssueDate,
  formatStatusTone,
} from "@/features/admin-console/lib/presenters";
import { useAuth } from "@/lib/auth/auth-provider";

type AdminUsersScreenProps = Readonly<{
  locale: string;
}>;

export function AdminUsersScreen({ locale }: AdminUsersScreenProps) {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const users = useAdminUsers(token, Boolean(isAdmin), 60);

  if (!user) {
    return <AuthRequiredCard locale={locale} />;
  }

  if (!isAdmin) {
    return <InlineMessage variant="error">{adminConsoleCopy.common.adminOnly}</InlineMessage>;
  }

  const orderedUsers = [...users.data].sort(
    (left, right) =>
      right.abuse_risk_score - left.abuse_risk_score ||
      left.trust_score - right.trust_score,
  );

  return (
    <section className="space-y-6">
      <AdminSurface>
        <AdminSectionHeader
          eyebrow={adminConsoleCopy.users.eyebrow}
          title={adminConsoleCopy.users.title}
          body={adminConsoleCopy.users.description}
        />
      </AdminSurface>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label={adminConsoleCopy.users.listTitle}
          value={formatCompactNumber(orderedUsers.length)}
        />
        <AdminMetricCard
          label={adminConsoleCopy.common.high}
          value={formatCompactNumber(
            orderedUsers.filter((entry) => entry.abuse_risk_level === "high").length,
          )}
          tone="accent"
        />
        <AdminMetricCard
          label={adminConsoleCopy.common.medium}
          value={formatCompactNumber(
            orderedUsers.filter((entry) => entry.abuse_risk_level === "medium").length,
          )}
        />
        <AdminMetricCard
          label={adminConsoleCopy.users.metricsTitle}
          value={formatCompactNumber(
            orderedUsers.filter((entry) => entry.sanction_count > 0).length,
          )}
        />
      </div>

      {users.error ? <InlineMessage variant="error">{users.error}</InlineMessage> : null}

      {users.isLoading ? (
        <PageLoading title={adminConsoleCopy.common.loading} />
      ) : orderedUsers.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {orderedUsers.map((entry) => (
            <AdminSurface key={entry.user.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge
                      label={entry.user.role}
                      tone={entry.user.role === "admin" ? "primary" : "subtle"}
                    />
                    <AdminStatusBadge
                      label={formatAbuseRiskLabel(entry.abuse_risk_level)}
                      tone={formatStatusTone(entry.abuse_risk_level)}
                    />
                    <AdminStatusBadge
                      label={entry.user.is_active ? adminConsoleCopy.common.active : adminConsoleCopy.common.banned}
                      tone={entry.user.is_active ? "primary" : "accent"}
                    />
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-semibold text-white">
                    {entry.user.full_name}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {entry.summary ?? adminConsoleCopy.common.noData}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <span>{entry.user.email}</span>
                    <span>{entry.trust_score.toFixed(1)}</span>
                    <span>{entry.trust_weight_multiplier.toFixed(3)}</span>
                    <span>{formatIssueDate(entry.updated_at)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline">
                    <Link href={`/${locale}/admin/users/${entry.user.id}` as Route}>
                      {adminConsoleCopy.common.openUser}
                    </Link>
                  </Button>
                </div>
              </div>
            </AdminSurface>
          ))}
        </div>
      ) : (
        <EmptyState
          title={adminConsoleCopy.users.emptyTitle}
          body={adminConsoleCopy.users.emptyBody}
        />
      )}
    </section>
  );
}
