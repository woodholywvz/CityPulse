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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminKeyValueGrid,
  AdminSectionHeader,
  AdminStatusBadge,
  AdminSurface,
} from "@/features/admin-console/components/admin-primitives";
import { useAdminTicketDetail } from "@/features/admin-console/hooks/use-admin-console";
import {
  formatIssueDate,
  formatIssueStatus,
  formatLifecycleLabel,
  formatStatusTone,
} from "@/features/admin-console/lib/presenters";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { useAdminCopy } from "@/lib/i18n-provider";

type AdminTicketDetailScreenProps = Readonly<{
  locale: string;
  ticketId: string;
}>;

const STATUS_OPTIONS = [
  "open",
  "under_review",
  "waiting_for_user",
  "resolved",
  "closed",
] as const;

export function AdminTicketDetailScreen({
  locale,
  ticketId,
}: AdminTicketDetailScreenProps) {
  const adminConsoleCopy = useAdminCopy();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const detail = useAdminTicketDetail(token, Boolean(isAdmin), ticketId);
  const [replyBody, setReplyBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("under_review");
  const [statusNote, setStatusNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!user) {
    return <AuthRequiredCard locale={locale} />;
  }

  if (!isAdmin) {
    return <InlineMessage variant="error">{adminConsoleCopy.common.adminOnly}</InlineMessage>;
  }

  function sendReply() {
    if (!token || !replyBody.trim()) {
      return;
    }

    startTransition(async () => {
      try {
        const nextDetail = await apiClient.replyAdminTicket(token, ticketId, {
          body: replyBody.trim(),
          is_internal: isInternal,
          status,
        });
        detail.setData(nextDetail);
        setReplyBody("");
        setMessage(adminConsoleCopy.common.successSaved);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : adminConsoleCopy.common.noData);
      }
    });
  }

  function updateStatus() {
    if (!token) {
      return;
    }

    startTransition(async () => {
      try {
        const nextDetail = await apiClient.updateAdminTicketStatus(token, ticketId, {
          status,
          note: statusNote || null,
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
        title={adminConsoleCopy.tickets.detailTitle}
        body={adminConsoleCopy.common.noSelection}
      />
    );
  }

  const current = detail.data;

  return (
    <section className="space-y-6">
      <AdminSurface>
        <AdminSectionHeader
          eyebrow={adminConsoleCopy.tickets.eyebrow}
          title={current.subject}
          body={adminConsoleCopy.tickets.description}
          action={
            <Button asChild variant="outline">
              <Link href={`/${locale}/admin/tickets` as Route}>
                {adminConsoleCopy.common.backToTickets}
              </Link>
            </Button>
          }
        />
        <div className="mt-6 flex flex-wrap gap-2">
          <AdminStatusBadge label={current.type} tone="primary" />
          <AdminStatusBadge
            label={formatLifecycleLabel(current.status)}
            tone={formatStatusTone(current.status)}
          />
        </div>
        <div className="mt-6">
          <AdminKeyValueGrid
            columns={4}
            items={[
              {
                label: adminConsoleCopy.common.filterStatus,
                value: formatLifecycleLabel(current.status),
              },
              {
                label: adminConsoleCopy.common.linkedIssueLabel,
                value: current.issue_title ?? adminConsoleCopy.common.noData,
              },
              {
                label: adminConsoleCopy.tickets.issueContextTitle,
                value: current.issue_status
                  ? formatIssueStatus(current.issue_status)
                  : adminConsoleCopy.common.noData,
              },
              {
                label: adminConsoleCopy.common.requesterLabel,
                value: current.author.full_name,
              },
            ]}
          />
        </div>
      </AdminSurface>

      {message ? <InlineMessage variant="info">{message}</InlineMessage> : null}

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <AdminSurface>
          <AdminSectionHeader title={adminConsoleCopy.tickets.messagesTitle} />
          <div className="mt-6 grid gap-4">
            {current.messages.length ? (
              current.messages.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge
                      label={entry.author_role}
                      tone={entry.author_role === "admin" ? "primary" : "subtle"}
                    />
                    {entry.is_internal ? (
                      <AdminStatusBadge
                        label={adminConsoleCopy.common.internalNote}
                        tone="accent"
                      />
                    ) : (
                      <AdminStatusBadge
                        label={adminConsoleCopy.common.externalReply}
                        tone="subtle"
                      />
                    )}
                  </div>
                  <p className="mt-3 font-semibold text-white">{entry.author_name}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{entry.body}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {formatIssueDate(entry.created_at)}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-300">
                {adminConsoleCopy.tickets.noMessages}
              </p>
            )}
          </div>
        </AdminSurface>

        <div className="space-y-6">
          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.tickets.messageLabel} />
            <div className="mt-6 grid gap-4">
              <Field label={adminConsoleCopy.tickets.messageLabel}>
                <Textarea
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  rows={6}
                />
              </Field>
              <label className="flex items-center gap-3 rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(event) => setIsInternal(event.target.checked)}
                />
                <span>{adminConsoleCopy.tickets.internalLabel}</span>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white">
                  {adminConsoleCopy.tickets.statusLabel}
                </span>
                <Select value={status} onChange={(event) => setStatus(event.target.value as (typeof STATUS_OPTIONS)[number])}>
                  {STATUS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {formatLifecycleLabel(value)}
                    </option>
                  ))}
                </Select>
              </label>
              <Button type="button" variant="secondary" disabled={isPending} onClick={sendReply}>
                {adminConsoleCopy.tickets.sendReply}
              </Button>
            </div>
          </AdminSurface>

          <AdminSurface>
            <AdminSectionHeader title={adminConsoleCopy.tickets.statusLabel} />
            <div className="mt-6 grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white">
                  {adminConsoleCopy.tickets.statusLabel}
                </span>
                <Select value={status} onChange={(event) => setStatus(event.target.value as (typeof STATUS_OPTIONS)[number])}>
                  {STATUS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {formatLifecycleLabel(value)}
                    </option>
                  ))}
                </Select>
              </label>
              <Field label={adminConsoleCopy.issues.noteLabel}>
                <Textarea
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  rows={4}
                />
              </Field>
              <Button type="button" variant="outline" disabled={isPending} onClick={updateStatus}>
                {adminConsoleCopy.tickets.applyStatus}
              </Button>
            </div>
          </AdminSurface>
        </div>
      </div>
    </section>
  );
}
