"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Activity,
  FileSearch,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
  Tickets,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AuthStatus } from "@/components/auth/auth-status";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminConsoleCopy } from "@/content/admin-console";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type AdminShellProps = Readonly<{
  children: React.ReactNode;
  locale: string;
}>;

export function AdminShell({ children, locale }: AdminShellProps) {
  const pathname = usePathname();
  const navigation: Array<{ href: Route; label: string; icon: LucideIcon }> = [
    {
      href: `/${locale}/admin` as Route,
      label: adminConsoleCopy.shell.sections.dashboard,
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/admin/issues` as Route,
      label: adminConsoleCopy.shell.sections.issues,
      icon: FileSearch,
    },
    {
      href: `/${locale}/admin/moderation` as Route,
      label: adminConsoleCopy.shell.sections.moderation,
      icon: ShieldCheck,
    },
    {
      href: `/${locale}/admin/tickets` as Route,
      label: adminConsoleCopy.shell.sections.tickets,
      icon: Tickets,
    },
    {
      href: `/${locale}/admin/users` as Route,
      label: adminConsoleCopy.shell.sections.users,
      icon: Users,
    },
    {
      href: `/${locale}/admin/heatmap` as Route,
      label: adminConsoleCopy.shell.sections.heatmap,
      icon: MapPinned,
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(8,145,178,0.16),transparent_30%),linear-gradient(180deg,#08111b_0%,#0f172a_55%,#111827_100%)] text-slate-50">
      <div className="container py-4 lg:py-6">
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-soft backdrop-blur-xl">
              <Link href={`/${locale}/admin` as Route} className="flex items-start gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-sm font-bold text-cyan-100 shadow-soft">
                  CP
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-xl font-semibold">
                    {siteConfig.name}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.28em] text-cyan-200/80">
                    {adminConsoleCopy.shell.sectionLabel}
                  </p>
                </div>
              </Link>

              <div className="mt-5 rounded-[1.5rem] border border-cyan-300/10 bg-cyan-300/5 p-4">
                <Badge variant="accent">{adminConsoleCopy.shell.sections.dashboard}</Badge>
                <h1 className="mt-3 font-display text-2xl font-semibold">
                  {adminConsoleCopy.shell.title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {adminConsoleCopy.shell.description}
                </p>
              </div>

              <nav
                aria-label={adminConsoleCopy.shell.navigationLabel}
                className="mt-5 grid gap-2"
              >
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== `/${locale}/admin` && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-[1.25rem] border px-4 py-3 text-sm font-semibold transition-colors",
                        isActive
                          ? "border-cyan-300/30 bg-cyan-300/12 text-cyan-100"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/${locale}/issues` as Route}>
                    {adminConsoleCopy.shell.publicView}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/${locale}/dashboard` as Route}>
                    {adminConsoleCopy.shell.citizenView}
                  </Link>
                </Button>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <ThemeToggle />
                <AuthStatus locale={locale} />
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-soft backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 text-cyan-100">
                    <Activity className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.3em]">
                      {adminConsoleCopy.shell.sectionLabel}
                    </p>
                  </div>
                  <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                    {adminConsoleCopy.shell.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {adminConsoleCopy.shell.description}
                  </p>
                </div>
                <Badge variant="primary" className="hidden lg:inline-flex">
                  {siteConfig.name}
                </Badge>
              </div>
            </header>

            {children}
          </div>
        </div>
      </div>

      <nav
        aria-label={adminConsoleCopy.shell.mobileNavigationLabel}
        className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[calc(100%-1.5rem)] max-w-xl items-center justify-between rounded-[1.85rem] border border-white/10 bg-slate-950/90 px-3 py-2 shadow-soft backdrop-blur xl:hidden"
      >
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== `/${locale}/admin` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold",
                isActive ? "bg-cyan-300/12 text-cyan-100" : "text-slate-400",
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
