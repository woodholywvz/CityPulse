"use client";

import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppCopy } from "@/lib/i18n-provider";

type AuthRequiredCardProps = Readonly<{
  locale: string;
}>;

export function AuthRequiredCard({ locale }: AuthRequiredCardProps) {
  const appCopy = useAppCopy();

  return (
    <EmptyState
      title={appCopy.auth.requiredTitle}
      body={appCopy.auth.requiredBody}
      action={
        <Button asChild>
          <Link href={`/${locale}/auth` as Route}>{appCopy.auth.goToAuth}</Link>
        </Button>
      }
    />
  );
}
