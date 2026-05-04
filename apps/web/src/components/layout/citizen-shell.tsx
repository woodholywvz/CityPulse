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
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppCopy } from "@/lib/i18n-provider";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type CitizenShellProps = Readonly<{
  children: React.ReactNode;
  locale: string;
}>;

export function CitizenShell({ children, locale }: CitizenShellProps) {
  const pathname = usePathname();
  const appCopy = useAppCopy();
  const isDiscoverRoute = pathname === `/${locale}/discover`;
  const mobileBottomInsetClass = "pb-[calc(6.5rem+env(safe-area-inset-bottom))]";
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
    {
      href: `/${locale}/issues` as Route,
      label: appCopy.citizenShell.publicIssues,
      icon: ListFilter,
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
    <div className={cn("min-h-screen md:pb-10", mobileBottomInsetClass)}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/88 backdrop-blur-xl">
        <a
          href="#main-content"
          className="sr-only absolute left-4 top-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only"
        >
          {appCopy.header.skipToContent}
        </a>
        <div className="container py-3 md:py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <Link href={`/${locale}` as Route} className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft md:h-12 md:w-12">
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
                {appCopy.citizenShell.eyebrow}
              </Badge>
              <LocaleSwitcher locale={locale} compact />
              <ThemeToggle />
              <AuthStatus locale={locale} />
            </div>
          </div>

          <nav
            className="mt-4 hidden flex-wrap items-center gap-2 md:flex"
            aria-label={appCopy.citizenShell.mobileNavigation}
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== `/${locale}/dashboard` && pathname.startsWith(item.href));

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

      <main id="main-content" className="container py-8">
        {isDiscoverRoute ? null : (
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
                <Link href={`/${locale}/issues` as Route}>
                  {appCopy.citizenShell.backToPublic}
                </Link>
              </Button>
            </div>
          </section>
        )}

        <div className={cn(isDiscoverRoute ? "pb-4" : "mt-8")}>{children}</div>
      </main>

      <nav
        aria-label={appCopy.citizenShell.mobileNavigation}
        className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto grid w-[calc(100%-1rem)] max-w-lg grid-cols-5 items-center gap-1 rounded-[1.4rem] border border-border/70 bg-background/94 px-2 py-2 shadow-soft backdrop-blur md:hidden"
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
              aria-label={item.label}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1rem] px-1 py-2 text-[10px] font-semibold leading-none transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-card/70",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="sr-only min-[390px]:not-sr-only min-[390px]:block max-w-full truncate text-center text-[10px] leading-3">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
