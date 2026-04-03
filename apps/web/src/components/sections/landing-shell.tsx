"use client";

import type { Route } from "next";
import Link from "next/link";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Globe2,
  ShieldCheck,
  Sparkles,
  Users2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-provider";
import { useI18n } from "@/lib/i18n-provider";

type LandingShellProps = Readonly<{
  locale: string;
}>;

export function LandingShell({ locale }: LandingShellProps) {
  const { messages } = useI18n();
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const steps = messages.landing.steps;
  const pillars = [
    {
      icon: Globe2,
      title: messages.landing.pillars[0]?.title ?? "",
      body: messages.landing.pillars[0]?.body ?? "",
    },
    {
      icon: ShieldCheck,
      title: messages.landing.pillars[1]?.title ?? "",
      body: messages.landing.pillars[1]?.body ?? "",
    },
    {
      icon: Building2,
      title: messages.landing.pillars[2]?.title ?? "",
      body: messages.landing.pillars[2]?.body ?? "",
    },
  ];
  const panels: Array<{
    icon: LucideIcon;
    label: string;
    href: Route;
    body: string;
  }> = [
    {
      icon: Users2,
      label: messages.landing.panels[0]?.label ?? "",
      href: `/${locale}/dashboard` as Route,
      body: messages.landing.panels[0]?.body ?? "",
    },
    {
      icon: Sparkles,
      label: messages.landing.panels[1]?.label ?? "",
      href: `/${locale}/admin` as Route,
      body: messages.landing.panels[1]?.body ?? "",
    },
  ];

  return (
    <main>
      <section className="container relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-x-0 top-8 -z-10 mx-auto h-72 w-72 rounded-full bg-orange-300/30 blur-3xl" />
        <div className="absolute right-0 top-24 -z-10 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? undefined : { duration: 0.55, ease: "easeOut" }}
          className="mx-auto max-w-5xl"
        >
          <div className="inline-flex rounded-full border border-primary/20 bg-card/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-primary shadow-soft backdrop-blur">
            {messages.landing.heroTagline}
          </div>
          <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl">
            {messages.landing.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            {messages.landing.heroBody}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={`/${locale}/dashboard`}>
                {messages.landing.citizenCta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {user?.role === "admin" ? (
              <Button asChild size="lg" variant="outline">
                <Link href={`/${locale}/admin`}>{messages.landing.adminCta}</Link>
              </Button>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion ? undefined : { duration: 0.6, ease: "easeOut", delay: 0.1 }
          }
          className="mt-12 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-[1.5rem] border border-border/70 bg-gradient-to-b from-card via-card to-muted/70 p-5 text-foreground"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">
                    0{index + 1}
                  </p>
                  <h2 className="mt-4 font-display text-2xl font-semibold">{step.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-secondary/60 p-6 shadow-soft sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              {messages.landing.postureEyebrow}
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-foreground">
              {messages.landing.postureTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {messages.landing.postureBody}
            </p>
          </div>
        </motion.div>
      </section>

      <section id="how-it-works" className="container py-8 sm:py-14">
        <div className="grid gap-5 lg:grid-cols-3">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;

            return (
              <motion.article
                key={pillar.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={shouldReduceMotion ? undefined : { duration: 0.45, delay: index * 0.08 }}
                className="rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-2xl font-semibold">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{pillar.body}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section id="panels" className="container py-8 sm:py-14">
        <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                {messages.landing.panelsEyebrow}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold">
                {messages.landing.panelsTitle}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {messages.landing.panelsBody}
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {panels.map((panel) => {
              const Icon = panel.icon;

              return (
                <Link
                  key={panel.label}
                  href={panel.href}
                  className="group rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-card via-card to-muted/70 p-6 text-foreground transition-transform duration-300 hover:-translate-y-1"
                >
                  <Icon className="h-7 w-7 text-orange-300" />
                  <h3 className="mt-4 font-display text-2xl font-semibold">{panel.label}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{panel.body}</p>
                  <span className="mt-6 inline-flex items-center text-sm font-semibold text-orange-300">
                    {messages.landing.openPanel}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="readiness" className="container pb-20 pt-8 sm:pb-24 sm:pt-14">
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-border/70 bg-gradient-to-br from-card via-card to-accent/25 p-8 text-foreground shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
              {messages.landing.readinessEyebrow}
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold">
              {messages.landing.readinessTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {messages.landing.readinessBody}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {messages.landing.readinessItems.map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5 text-sm leading-6 text-muted-foreground shadow-soft backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
