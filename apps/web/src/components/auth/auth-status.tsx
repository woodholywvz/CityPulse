"use client";

import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-provider";
import { useAppCopy } from "@/lib/i18n-provider";

type AuthStatusProps = Readonly<{
  locale: string;
}>;

export function AuthStatus({ locale }: AuthStatusProps) {
  const { isReady, user, logout } = useAuth();
  const appCopy = useAppCopy();

  if (!isReady) {
    return (
      <Badge variant="subtle" className="h-12 px-4 tracking-[0.2em]">
        {appCopy.common.loading}
      </Badge>
    );
  }

  if (!user) {
    return (
      <Button asChild variant="outline" className="h-12 rounded-full px-5">
        <Link href={`/${locale}/auth` as Route}>{appCopy.header.signIn}</Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="hidden h-12 max-w-[20rem] items-center rounded-full border border-border/70 bg-card/80 px-4 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground shadow-soft lg:inline-flex">
        <span className="truncate">
          {appCopy.header.signedInAs}: {user.full_name}
        </span>
      </div>
      <Button type="button" variant="outline" className="h-12 rounded-full px-5" onClick={logout}>
        {appCopy.header.signOut}
      </Button>
    </div>
  );
}
