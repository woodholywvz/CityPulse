"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { AuthRequiredCard } from "@/components/auth/auth-required-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineMessage } from "@/components/ui/inline-message";
import { PageLoading } from "@/components/ui/page-loading";
import { Select } from "@/components/ui/select";
import { adminConsoleCopy } from "@/content/admin-console";
import {
  AdminMetricCard,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminSurface,
} from "@/features/admin-console/components/admin-primitives";
import { useAdminTickets } from "@/features/admin-console/hooks/use-admin-console";
import {
  formatCompactNumber,
  formatIssueDate,
  formatLifecycleLabel,
  formatStatusTone,
} from "@/features/admin-console/lib/presenters";
import { useAuth } from "@/lib/auth/auth-provider";

type AdminTicketsScreenProps = Readonly<{
  locale: string;
}>;

const TICKET_STATUS_OPTIONS = [
  "",
  "open",
  "under_review",
  "waiting_for_user",
  "resolved",
  "closed",
] as const;

const TICKET_TYPE_OPTIONS = ["", "appeal", "bug_report", "improvement"] as const;
const TICKET_STATUS_VALUES = TICKET_STATUS_OPTIONS.filter(
  (value): value is Exclude<(typeof TICKET_STATUS_OPTIONS)[number], ""> => Boolean(value),
);
const TICKET_TYPE_VALUES = TICKET_TYPE_OPTIONS.filter(
  (value): value is Exclude<(typeof TICKET_TYPE_OPTIONS)[number], ""> => Boolean(value),
);

export function AdminTicketsScreen({ locale }: AdminTicketsScreenProps) {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [status, setStatus] = useState("");
  const [ticketType, setTicketType] = useState("");
  const tickets = useAdminTickets(token, Boolean(isAdmin), {
    limit: 60,
    status: status || null,
    ticketType: ticketType || null,
  });

  if (!user) {
    return <AuthRequiredCard locale={locale} />;
  }

  if (!isAdmin) {
    return <InlineMessage variant="error">{adminConsoleCopy.common.adminOnly}</InlineMessage>;
  }

  const openCount = tickets.data.filter((item) => item.status === "open").length;
  const appealCount = tickets.data.filter((item) => item.type === "appeal").length;

  return (
    <section className="space-y-6">
      <AdminSurface>
        <AdminSectionHeader
          eyebrow={adminConsoleCopy.tickets.eyebrow}
          title={adminConsoleCopy.tickets.title}
          body={adminConsoleCopy.tickets.description}
        />
      </AdminSurface>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminMetricCard
          label={adminConsoleCopy.tickets.listTitle}
          value={formatCompactNumber(tickets.data.length)}
        />
        <AdminMetricCard
          label={adminConsoleCopy.common.queued}
          value={formatCompactNumber(openCount)}
          tone="accent"
        />
        <AdminMetricCard
          label={adminConsoleCopy.common.appeals}
          value={formatCompactNumber(appealCount)}
          tone="primary"
        />
      </div>

      <AdminSurface>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">
              {adminConsoleCopy.common.filterStatus}
            </span>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">{adminConsoleCopy.common.filterAll}</option>
              {TICKET_STATUS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {formatLifecycleLabel(value)}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-white">
              {adminConsoleCopy.common.filterTicketType}
            </span>
            <Select value={ticketType} onChange={(event) => setTicketType(event.target.value)}>
              <option value="">{adminConsoleCopy.common.filterAll}</option>
              {TICKET_TYPE_VALUES.map((value) => (
                <option key={value} value={value}>
                  {formatLifecycleLabel(value)}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </AdminSurface>

      {tickets.error ? <InlineMessage variant="error">{tickets.error}</InlineMessage> : null}

      {tickets.isLoading ? (
        <PageLoading title={adminConsoleCopy.common.loading} />
      ) : tickets.data.length ? (
        <div className="grid gap-4">
          {tickets.data.map((ticket) => (
            <AdminSurface key={ticket.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge label={ticket.type} tone="primary" />
                    <AdminStatusBadge
                      label={formatLifecycleLabel(ticket.status)}
                      tone={formatStatusTone(ticket.status)}
                    />
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-semibold text-white">
                    {ticket.subject}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {ticket.latest_message_preview ?? adminConsoleCopy.common.noData}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <span>{ticket.author.full_name}</span>
                    <span>
                      {ticket.message_count} {adminConsoleCopy.tickets.messagesTitle}
                    </span>
                    <span>{ticket.issue_title ?? adminConsoleCopy.common.noData}</span>
                    <span>{formatIssueDate(ticket.updated_at)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline">
                    <Link href={`/${locale}/admin/tickets/${ticket.id}` as Route}>
                      {adminConsoleCopy.common.openTicket}
                    </Link>
                  </Button>
                </div>
              </div>
            </AdminSurface>
          ))}
        </div>
      ) : (
        <EmptyState
          title={adminConsoleCopy.tickets.emptyTitle}
          body={adminConsoleCopy.tickets.emptyBody}
        />
      )}
    </section>
  );
}
