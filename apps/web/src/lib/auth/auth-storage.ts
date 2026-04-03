const AUTH_STORAGE_KEY = "citypulse.auth";

export type StoredAuthSession = {
  token: string;
};

export function readStoredSession(): StoredAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuthSession;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: StoredAuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
