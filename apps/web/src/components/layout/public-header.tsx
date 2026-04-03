"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Compass, ListFilter, Map, Radar, Shield, Sparkles } from "lucide-react";

import { AuthStatus } from "@/components/auth/auth-status";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-provider";
import { useAppCopy } from "@/lib/i18n-provider";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type PublicHeaderProps = Readonly<{
  locale: string;
}>;

export function PublicHeader({ locale }: PublicHeaderProps) {
  const pathname = usePathname();
  const appCopy = useAppCopy();
  const { user } = useAuth();
  const navigation = [
    {
      href: `/${locale}/issues` as Route,
      label: appCopy.header.publicList,
      icon: ListFilter,
    },
    {
      href: `/${locale}/issues/map` as Route,
      label: appCopy.header.publicMap,
      icon: Map,
    },
    {
      href: `/${locale}/issues/heatmap` as Route,
      label: appCopy.header.publicHeatmap,
      icon: Radar,
    },
    {
      href: `/${locale}/discover` as Route,
      label: appCopy.header.discover,
      icon: Compass,
    },
    {
      href: `/${locale}/create` as Route,
      label: appCopy.header.create,
      icon: Sparkles,
    },
  ];

  const navItemClass = (isActive: boolean) =>
    cn(
      "inline-flex h-12 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors",
      isActive
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-border/70 bg-card/70 text-muted-foreground hover:bg-card",
    );

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <a
        href="#main-content"
        className="sr-only absolute left-4 top-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only"
      >
        {appCopy.header.skipToContent}
      </a>
      <div className="container py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <Link href={`/${locale}` as Route} className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft">
              CP
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold">{siteConfig.name}</p>
              <p className="truncate text-[0.7rem] uppercase tracking-[0.28em] text-muted-foreground">
                {appCopy.header.brandTagline}
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <Badge variant="primary" className="hidden xl:inline-flex">
              {appCopy.panelShell.publicLanding}
            </Badge>
            <LocaleSwitcher locale={locale} compact />
            <ThemeToggle />
            <AuthStatus locale={locale} />
            {user?.role === "admin" ? (
              <Button asChild variant="outline" className="h-12 rounded-full px-5">
                <Link href={`/${locale}/admin` as Route}>
                  <Shield className="mr-2 h-4 w-4" />
                  {appCopy.header.adminPanel}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <nav className="mt-4 flex flex-wrap items-center gap-2" aria-label={appCopy.panelShell.publicLanding}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== `/${locale}/issues` && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href} className={navItemClass(isActive)}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
