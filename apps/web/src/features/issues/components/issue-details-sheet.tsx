"use client";

import { useEffect, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { IssueDetailsContent } from "@/features/issues/components/issue-details-content";
import { usePublicIssueDetail } from "@/features/issues/hooks/use-public-issues";
import { InlineMessage } from "@/components/ui/inline-message";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { useAppCopy } from "@/lib/i18n-provider";

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
  const appCopy = useAppCopy();
  const { token } = useAuth();
  const { data, isLoading, error } = usePublicIssueDetail(issueId, isOpen);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);
  const [isSupporting, setIsSupporting] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

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
    } catch (requestError) {
      setSupportMessage(
        requestError instanceof Error ? requestError.message : appCopy.issueViews.errorTitle,
      );
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
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={appCopy.issueDetail.title}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-[2rem] border border-border/70 bg-background p-5 shadow-soft sm:inset-y-4 sm:right-4 sm:left-auto sm:w-[min(620px,calc(100vw-2rem))] sm:rounded-[2rem] sm:p-6"
            initial={shouldReduceMotion ? false : { y: 48, opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { y: 48, opacity: 0 }}
            transition={shouldReduceMotion ? undefined : { duration: 0.22, ease: "easeOut" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                {appCopy.issueDetail.title}
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label={appCopy.issueDetail.close}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/70 text-foreground transition-colors hover:bg-card"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3" aria-hidden="true">
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
