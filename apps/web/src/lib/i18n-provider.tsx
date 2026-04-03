"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
} from "react";

import type { AppMessages } from "@/messages/en";
import {
  getAppCopy,
  getLocaleLanguageTag,
  getLocaleOrDefault,
  getMessages,
  getPublicIntelligenceCopy,
  type AppLocale,
} from "@/lib/i18n";

type I18nContextValue = {
  locale: AppLocale;
  messages: AppMessages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = Readonly<{
  children: React.ReactNode;
  locale: string;
}>;

export function I18nProvider({ children, locale }: I18nProviderProps) {
  const normalizedLocale = getLocaleOrDefault(locale);
  const value = useMemo<I18nContextValue>(
    () => ({
      locale: normalizedLocale,
      messages: getMessages(normalizedLocale),
    }),
    [normalizedLocale],
  );

  useEffect(() => {
    document.documentElement.lang = getLocaleLanguageTag(normalizedLocale);
  }, [normalizedLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return context;
}

export function useAppCopy() {
  return useI18n().messages.app;
}

export function useAdminCopy() {
  return useI18n().messages.adminConsole;
}

export function usePublicIntelligenceMessages() {
  return useI18n().messages.publicIntelligence;
}

export function useLocaleMessages() {
  return useI18n().messages.localeSwitcher;
}

export function useValidationMessages() {
  return useI18n().messages.validation;
}

export function useLocaleFromContext() {
  return useI18n().locale;
}

export function getStaticCopy(locale: string) {
  const normalizedLocale = getLocaleOrDefault(locale);

  return {
    app: getAppCopy(normalizedLocale),
    admin: getMessages(normalizedLocale).adminConsole,
    publicIntelligence: getPublicIntelligenceCopy(normalizedLocale),
    locale: normalizedLocale,
    messages: getMessages(normalizedLocale),
  };
}
