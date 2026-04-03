type ObservabilityLevel = "info" | "warning" | "error";

type ObservabilityEvent = {
  name: string;
  level?: ObservabilityLevel;
  error?: unknown;
  context?: Record<string, unknown>;
};

declare global {
  interface WindowEventMap {
    "qala:observability": CustomEvent<ObservabilityEvent>;
  }
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown error",
  };
}

export function reportClientEvent(event: ObservabilityEvent) {
  const detail = {
    ...event,
    level: event.level ?? "error",
    error: normalizeError(event.error),
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("qala:observability", { detail }));
  }

  if (process.env.NODE_ENV !== "production") {
    // Centralized dev-only reporting hook. Replace with Sentry or municipal logging later.
    console.warn("[qala-observability]", detail);
  }
}
