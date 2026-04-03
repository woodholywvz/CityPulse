"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiClient, ApiError } from "@/lib/api/client";
import type { AuthTokenResponse, User } from "@/lib/api/types";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from "@/lib/auth/auth-storage";

type AuthContextValue = {
  isReady: boolean;
  token: string | null;
  user: User | null;
  errorMessage: string | null;
  login: (input: { email: string; password: string }) => Promise<AuthTokenResponse>;
  register: (input: {
    email: string;
    password: string;
    full_name: string;
    preferred_locale: string;
  }) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const stored = readStoredSession();
      if (!stored?.token) {
        if (isMounted) {
          setIsReady(true);
        }
        return;
      }

      try {
        const currentUser = await apiClient.getCurrentUser(stored.token);
        if (!isMounted) {
          return;
        }
        setToken(stored.token);
        setUser(currentUser);
      } catch {
        clearStoredSession();
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      token,
      user,
      errorMessage,
      login: async (input) => {
        setErrorMessage(null);
        try {
          const session = await apiClient.login(input);
          setToken(session.access_token);
          setUser(session.user);
          writeStoredSession({ token: session.access_token });
          return session;
        } catch (error) {
          if (error instanceof ApiError) {
            setErrorMessage(error.message);
          }
          throw error;
        }
      },
      register: async (input) => {
        setErrorMessage(null);
        try {
          const registeredUser = await apiClient.register(input);
          return registeredUser;
        } catch (error) {
          if (error instanceof ApiError) {
            setErrorMessage(error.message);
          }
          throw error;
        }
      },
      logout: () => {
        clearStoredSession();
        setToken(null);
        setUser(null);
      },
      refresh: async () => {
        if (!token) {
          setUser(null);
          return;
        }

        try {
          const currentUser = await apiClient.getCurrentUser(token);
          setUser(currentUser);
        } catch {
          clearStoredSession();
          setToken(null);
          setUser(null);
        }
      },
    }),
    [errorMessage, isReady, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
