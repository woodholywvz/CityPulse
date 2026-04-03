import { messagesByLocale } from "@/messages";
import type { AppMessages } from "@/messages/en";

export const supportedLocales = [
  "en",
  "ru",
  "kk-cyrl",
  "kk-latn",
] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const defaultLocale: AppLocale = "en";

export function isSupportedLocale(locale: string): locale is AppLocale {
  return supportedLocales.includes(locale as AppLocale);
}

export function getLocaleOrDefault(locale: string | null | undefined): AppLocale {
  return locale && isSupportedLocale(locale) ? locale : defaultLocale;
}

export function getMessages(locale: string | null | undefined): AppMessages {
  return messagesByLocale[getLocaleOrDefault(locale)];
}

export function getAppCopy(locale: string | null | undefined) {
  return getMessages(locale).app;
}

export function getAdminCopy(locale: string | null | undefined) {
  return getMessages(locale).adminConsole;
}

export function getPublicIntelligenceCopy(locale: string | null | undefined) {
  return getMessages(locale).publicIntelligence;
}

export function getLocaleLanguageTag(locale: AppLocale) {
  switch (locale) {
    case "ru":
      return "ru";
    case "kk-cyrl":
      return "kk-Cyrl-KZ";
    case "kk-latn":
      return "kk-Latn-KZ";
    case "en":
    default:
      return "en";
  }
}
