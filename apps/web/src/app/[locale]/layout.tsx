import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getMessages, isSupportedLocale, supportedLocales, type AppLocale } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n-provider";
import { siteConfig } from "@/lib/site";

export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<Metadata> {
  const { locale } = await params;
  const messages = getMessages(locale);

  return {
    title: siteConfig.name,
    description: messages.metadata.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return (
    <I18nProvider locale={locale}>
      <div data-locale={locale as AppLocale} className="min-h-screen">
        {children}
      </div>
    </I18nProvider>
  );
}
