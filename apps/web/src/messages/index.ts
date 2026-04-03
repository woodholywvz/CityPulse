import { enMessages, type AppMessages } from "@/messages/en";
import { kkCyrlMessages } from "@/messages/kk-cyrl";
import { kkLatnMessages } from "@/messages/kk-latn";
import { ruMessages } from "@/messages/ru";
import type { DeepPartial } from "@/messages/types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: DeepPartial<T> | undefined): T {
  if (!override) {
    return base;
  }

  const output = Array.isArray(base) ? [...base] : { ...base };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = (output as Record<string, unknown>)[key];

    if (Array.isArray(value)) {
      (output as Record<string, unknown>)[key] = value;
      continue;
    }

    if (isObject(baseValue) && isObject(value)) {
      (output as Record<string, unknown>)[key] = deepMerge(
        baseValue,
        value as DeepPartial<typeof baseValue>,
      );
      continue;
    }

    if (value !== undefined) {
      (output as Record<string, unknown>)[key] = value;
    }
  }

  return output as T;
}

export const messagesByLocale = {
  en: enMessages,
  ru: deepMerge(enMessages, ruMessages),
  "kk-cyrl": deepMerge(enMessages, kkCyrlMessages),
  "kk-latn": deepMerge(enMessages, kkLatnMessages),
} satisfies Record<string, AppMessages>;
