"use client";

import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/lib/auth/auth-provider";

type AppProvidersProps = Readonly<{
  children: React.ReactNode;
}>;

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
