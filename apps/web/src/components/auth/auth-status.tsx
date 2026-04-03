"use client";

import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { appCopy } from "@/content/copy";
import { useAuth } from "@/lib/auth/auth-provider";

type AuthStatusProps = Readonly<{
  locale: string;
}>;

export function AuthStatus({ locale }: AuthStatusProps) {
  const { isReady, user, logout } = useAuth();

  if (!isReady) {
    return (
      <Badge variant="subtle" className="tracking-[0.2em]">
        {appCopy.common.loading}
      </Badge>
    );
  }

  if (!user) {
    return (
      <Button asChild variant="ghost" size="sm">
        <Link href={`/${locale}/auth` as Route}>{appCopy.header.signIn}</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="subtle" className="hidden sm:inline-flex">
        {appCopy.header.signedInAs}: {user.full_name}
      </Badge>
      <Button type="button" variant="ghost" size="sm" onClick={logout}>
        {appCopy.header.signOut}
      </Button>
    </div>
  );
}
