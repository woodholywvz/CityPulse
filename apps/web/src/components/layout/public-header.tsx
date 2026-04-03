"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Compass, ListFilter, Map, Shield, Sparkles } from "lucide-react";

import { AuthStatus } from "@/components/auth/auth-status";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/content/copy";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type PublicHeaderProps = Readonly<{
  locale: string;
}>;

export function PublicHeader({ locale }: PublicHeaderProps) {
  const pathname = usePathname();
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

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container flex min-h-[4.5rem] flex-wrap items-center gap-3 py-3 lg:flex-nowrap lg:justify-between">
        <Link href={`/${locale}` as Route} className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft">
            CP
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold">{siteConfig.name}</p>
            <p className="truncate text-xs uppercase tracking-[0.28em] text-muted-foreground">
              {appCopy.header.brandTagline}
            </p>
          </div>
        </Link>

        <nav className="order-3 flex w-full items-center gap-2 overflow-x-auto pb-1 lg:order-2 lg:w-auto lg:justify-center">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== `/${locale}/issues` && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/70 bg-card/70 text-muted-foreground hover:bg-card",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:order-3">
          <ThemeToggle />
          <AuthStatus locale={locale} />
          <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Link href={`/${locale}/admin` as Route}>
              <Shield className="mr-2 h-4 w-4" />
              {appCopy.header.adminPanel}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
