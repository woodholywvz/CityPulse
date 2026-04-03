"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Compass,
  FilePlus2,
  FolderClock,
  LayoutDashboard,
  ListFilter,
  type LucideIcon,
} from "lucide-react";

import { AuthStatus } from "@/components/auth/auth-status";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/content/copy";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type CitizenShellProps = Readonly<{
  children: React.ReactNode;
  locale: string;
}>;

export function CitizenShell({ children, locale }: CitizenShellProps) {
  const pathname = usePathname();
  const navigation: Array<{
    href: Route;
    label: string;
    icon: LucideIcon;
  }> = [
    {
      href: `/${locale}/dashboard` as Route,
      label: appCopy.citizenShell.dashboard,
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/discover` as Route,
      label: appCopy.citizenShell.discover,
      icon: Compass,
    },
    {
      href: `/${locale}/create` as Route,
      label: appCopy.citizenShell.create,
      icon: FilePlus2,
    },
    {
      href: `/${locale}/my-issues` as Route,
      label: appCopy.citizenShell.myIssues,
      icon: FolderClock,
    },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container flex flex-wrap items-center gap-3 py-3">
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

          <div className="ml-auto flex items-center gap-2">
            <Badge variant="primary" className="hidden lg:inline-flex">
              {appCopy.citizenShell.eyebrow}
            </Badge>
            <ThemeToggle />
            <AuthStatus locale={locale} />
          </div>

          <nav className="order-3 flex w-full items-center gap-2 overflow-x-auto pb-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== `/${locale}/dashboard` && pathname.startsWith(item.href));

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

            <Button asChild variant="ghost" size="sm" className="ml-auto hidden lg:inline-flex">
              <Link href={`/${locale}/issues` as Route}>
                <ListFilter className="mr-2 h-4 w-4" />
                {appCopy.citizenShell.publicIssues}
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <section className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
            {appCopy.citizenShell.eyebrow}
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {appCopy.citizenShell.title}
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {appCopy.citizenShell.description}
              </p>
            </div>

            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/issues` as Route}>{appCopy.citizenShell.backToPublic}</Link>
            </Button>
          </div>
        </section>

        <div className="mt-8">{children}</div>
      </main>

      <nav
        aria-label={appCopy.citizenShell.mobileNavigation}
        className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[calc(100%-1.5rem)] max-w-md items-center justify-between rounded-[1.75rem] border border-border/70 bg-background/92 px-3 py-2 shadow-soft backdrop-blur md:hidden"
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== `/${locale}/dashboard` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
