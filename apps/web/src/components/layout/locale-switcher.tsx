"use client";

import { startTransition } from "react";

import { Globe2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";

import { Select } from "@/components/ui/select";
import { supportedLocales } from "@/lib/i18n";
import { useLocaleMessages } from "@/lib/i18n-provider";

type LocaleSwitcherProps = Readonly<{
  locale: string;
  compact?: boolean;
}>;

function replaceLocaleInPath(pathname: string, nextLocale: string) {
  const segments = pathname.split("/");

  if (segments.length < 2) {
    return `/${nextLocale}`;
  }

  segments[1] = nextLocale;
  return segments.join("/");
}

export function LocaleSwitcher({ locale, compact = false }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const localeMessages = useLocaleMessages();

  return (
    <label className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 text-sm text-foreground shadow-soft">
      <Globe2 className="h-4 w-4 text-primary" aria-hidden="true" />
      <span className={compact ? "sr-only" : "hidden font-medium lg:inline-flex"}>
        {localeMessages.label}
      </span>
      <Select
        aria-label={localeMessages.label}
        value={locale}
        className="h-full min-w-[9.5rem] border-0 bg-transparent px-0 py-0 text-sm font-medium shadow-none focus-visible:ring-0"
        onChange={(event) => {
          const nextLocale = event.target.value;
          const nextPath = pathname ? replaceLocaleInPath(pathname, nextLocale) : `/${nextLocale}`;

          startTransition(() => {
            router.push(nextPath as Route);
          });
        }}
      >
        {supportedLocales.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {localeMessages.locales[supportedLocale]}
          </option>
        ))}
      </Select>
    </label>
  );
}
