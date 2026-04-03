"use client";

import { useAppCopy } from "@/lib/i18n-provider";
import { siteConfig } from "@/lib/site";

export function PublicFooter() {
  const appCopy = useAppCopy();

  return (
    <footer className="border-t border-border/60 bg-background/80">
      <div className="container flex flex-col gap-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-base font-semibold text-foreground">{siteConfig.name}</p>
          <p>{appCopy.footer.description}</p>
        </div>
        <p>{appCopy.footer.readiness}</p>
      </div>
    </footer>
  );
}
