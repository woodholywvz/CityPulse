"use client";

import { useEffect, useState } from "react";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useAppCopy } from "@/lib/i18n-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const isDark = resolvedTheme === "dark";
  const appCopy = useAppCopy();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      aria-label={appCopy.header.themeToggle}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-12 w-12 rounded-full px-0"
    >
      {!isMounted ? (
        <span className="block h-4 w-4 rounded-full bg-current/30" aria-hidden="true" />
      ) : isDark ? (
        <SunMedium className="h-4 w-4" />
      ) : (
        <MoonStar className="h-4 w-4" />
      )}
    </Button>
  );
}
