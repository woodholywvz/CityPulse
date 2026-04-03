import type { Route } from "next";
import Link from "next/link";

import { ArrowRight, Compass, FilePlus2, FolderClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/content/copy";

type DashboardPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

const ICONS = [Compass, FilePlus2, FolderClock];

export default async function CitizenDashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;

  const hrefs: Route[] = [
    `/${locale}/discover` as Route,
    `/${locale}/create` as Route,
    `/${locale}/my-issues` as Route,
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur sm:p-8">
        <Badge variant="primary">{appCopy.dashboard.eyebrow}</Badge>
        <h2 className="mt-5 font-display text-4xl font-semibold tracking-tight">
          {appCopy.dashboard.title}
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          {appCopy.dashboard.description}
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {appCopy.dashboard.cards.map((card, index) => {
          const Icon = ICONS[index];

          return (
            <article
              key={card.title}
              className="rounded-[1.75rem] border border-border/70 bg-card/85 p-6 shadow-soft backdrop-blur"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{card.description}</p>
              <Button asChild variant="outline" className="mt-6">
                <Link href={hrefs[index]}>
                  {card.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </article>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {appCopy.dashboard.highlights.map((highlight) => (
          <div
            key={highlight}
            className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5 text-sm leading-6 text-muted-foreground"
          >
            {highlight}
          </div>
        ))}
      </div>
    </section>
  );
}
