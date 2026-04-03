import Link from "next/link";

import { defaultLocale, getMessages } from "@/lib/i18n";

export default function NotFound() {
  const messages = getMessages(defaultLocale);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md rounded-[2rem] border border-border/80 bg-white/80 p-8 text-center shadow-soft backdrop-blur">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
          {messages.notFound.eyebrow}
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold">{messages.notFound.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {messages.notFound.body}
        </p>
        <Link
          href={`/${defaultLocale}`}
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          {messages.notFound.cta}
        </Link>
      </div>
    </main>
  );
}
