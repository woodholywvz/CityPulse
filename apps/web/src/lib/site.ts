import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_API_BASE_URL: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }
      const trimmed = value.trim();
      return trimmed ? trimmed : undefined;
    },
    z.string().url().optional(),
  ),
});

const parsedEnv = envSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

const rawApiBaseUrl = parsedEnv.success
  ? parsedEnv.data.NEXT_PUBLIC_API_BASE_URL
  : undefined;

function normalizeClientHostname(hostname: string) {
  if (hostname === "0.0.0.0") {
    return "localhost";
  }

  return hostname;
}

export function resolveApiBaseUrl() {
  if (rawApiBaseUrl) {
    return rawApiBaseUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = normalizeClientHostname(window.location.hostname);
    return `http://${hostname}:8000`;
  }

  return "http://localhost:8000";
}

export const siteConfig = {
  name: parsedEnv.success && parsedEnv.data.NEXT_PUBLIC_APP_NAME
    ? parsedEnv.data.NEXT_PUBLIC_APP_NAME
    : "CityPulse",
  apiBaseUrl: resolveApiBaseUrl(),
};
