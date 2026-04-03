"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { InlineMessage } from "@/components/ui/inline-message";
import { appCopy } from "@/content/copy";
import { usePublicIssueDetail } from "@/features/issues/hooks/use-public-issues";
import { IssueDetailsContent } from "@/features/issues/components/issue-details-content";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";

type IssueDetailsSheetProps = Readonly<{
  locale: string;
  issueId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onFeedbackSaved?: () => void;
}>;

export function IssueDetailsSheet({
  locale,
  issueId,
  isOpen,
  onClose,
  onFeedbackSaved,
}: IssueDetailsSheetProps) {
  const { token } = useAuth();
  const { data, isLoading, error } = usePublicIssueDetail(issueId, isOpen);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);
  const [isSupporting, setIsSupporting] = useState(false);

  async function handleSupport() {
    if (!token || !issueId) {
      return;
    }

    setIsSupporting(true);
    setSupportMessage(null);

    try {
      await apiClient.sendIssueFeedback(token, issueId, "support");
      setSupportMessage(appCopy.discover.savedAction);
      onFeedbackSaved?.();
    } catch (error) {
      setSupportMessage(error instanceof Error ? error.message : appCopy.issueViews.errorTitle);
    } finally {
      setIsSupporting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label={appCopy.issueDetail.close}
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-[2rem] border border-border/70 bg-background p-5 shadow-soft sm:inset-y-4 sm:right-4 sm:left-auto sm:w-[min(620px,calc(100vw-2rem))] sm:rounded-[2rem] sm:p-6"
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                {appCopy.issueDetail.title}
              </p>
              <button
                type="button"
                aria-label={appCopy.issueDetail.close}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/70 text-foreground transition-colors hover:bg-card"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <div className="h-56 animate-pulse rounded-[1.5rem] bg-muted" />
                <div className="h-6 w-1/2 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded-full bg-muted" />
              </div>
            ) : error ? (
              <InlineMessage variant="error">{error}</InlineMessage>
            ) : data ? (
              <div className="space-y-4">
                {supportMessage ? (
                  <InlineMessage
                    variant={supportMessage === appCopy.discover.savedAction ? "success" : "error"}
                  >
                    {supportMessage}
                  </InlineMessage>
                ) : null}
                <IssueDetailsContent
                  issue={data}
                  locale={locale}
                  onSupport={token ? handleSupport : undefined}
                  isSupporting={isSupporting}
                />
              </div>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
