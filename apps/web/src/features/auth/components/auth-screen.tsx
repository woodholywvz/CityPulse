"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { InlineMessage } from "@/components/ui/inline-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-provider";
import { supportedLocales } from "@/lib/i18n";
import {
  useAppCopy,
  useLocaleMessages,
  useValidationMessages,
} from "@/lib/i18n-provider";
type SignInValues = {
  email: string;
  password: string;
};
type RegisterValues = {
  full_name: string;
  email: string;
  password: string;
  preferred_locale: string;
};

type AuthScreenProps = Readonly<{
  locale: string;
}>;

export function AuthScreen({ locale }: AuthScreenProps) {
  const [mode, setMode] = useState<"sign-in" | "register">("sign-in");
  const [notice, setNotice] = useState<string | null>(null);
  const { user, errorMessage, login, register } = useAuth();
  const router = useRouter();
  const appCopy = useAppCopy();
  const localeMessages = useLocaleMessages();
  const validation = useValidationMessages();
  const signInSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(validation.validEmail),
        password: z.string().min(8, validation.passwordMin),
      }),
    [validation],
  );
  const registerSchema = useMemo(
    () =>
      z.object({
        full_name: z.string().min(2, validation.fullNameMin),
        email: z.string().email(validation.validEmail),
        password: z.string().min(8, validation.passwordMin),
        preferred_locale: z.string().min(2, validation.preferredLocale),
      }),
    [validation],
  );

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      preferred_locale: locale,
    },
  });

  async function handleSignIn(values: SignInValues) {
    setNotice(null);
    await login(values);
    router.push(`/${locale}/discover` as Route);
  }

  async function handleRegister(values: RegisterValues) {
    await register(values);
    setMode("sign-in");
    setNotice(appCopy.auth.registrationSuccess);
    registerForm.reset({
      full_name: "",
      email: "",
      password: "",
      preferred_locale: locale,
    });
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur sm:p-8">
        <Badge variant="primary">{appCopy.auth.title}</Badge>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">
          {appCopy.auth.subtitle}
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">{appCopy.auth.helper}</p>

        {user ? (
          <div className="mt-6 rounded-[1.5rem] border border-emerald-400/30 bg-emerald-400/10 p-5">
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">
              {user.full_name}
            </p>
            <p className="mt-2 text-sm text-emerald-900/80 dark:text-emerald-100/80">
              {user.email}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/${locale}/discover` as Route}>{appCopy.header.discover}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/my-issues` as Route}>{appCopy.header.myIssues}</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-soft backdrop-blur sm:p-8">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mode === "sign-in"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {appCopy.auth.signInTitle}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mode === "register"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {appCopy.auth.registerTitle}
          </button>
        </div>

        {notice ? <InlineMessage className="mt-5">{notice}</InlineMessage> : null}
        {errorMessage ? (
          <InlineMessage className="mt-5" variant="error">
            {errorMessage}
          </InlineMessage>
        ) : null}

        {mode === "sign-in" ? (
          <form
            className="mt-6 space-y-4"
            onSubmit={signInForm.handleSubmit(handleSignIn)}
          >
            <Field label={appCopy.auth.emailLabel} error={signInForm.formState.errors.email?.message}>
              <Input
                type="email"
                autoComplete="email"
                {...signInForm.register("email")}
              />
            </Field>
            <Field
              label={appCopy.auth.passwordLabel}
              error={signInForm.formState.errors.password?.message}
            >
              <Input
                type="password"
                autoComplete="current-password"
                {...signInForm.register("password")}
              />
            </Field>
            <Button type="submit" disabled={signInForm.formState.isSubmitting}>
              {signInForm.formState.isSubmitting
                ? appCopy.common.loading
                : appCopy.auth.signInAction}
            </Button>
            <p className="text-sm text-muted-foreground">
              {appCopy.auth.switchToRegister}{" "}
              <button
                type="button"
                className="font-semibold text-primary"
                onClick={() => setMode("register")}
              >
                {appCopy.auth.registerTitle}
              </button>
            </p>
          </form>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={registerForm.handleSubmit(handleRegister)}
          >
            <Field
              label={appCopy.auth.fullNameLabel}
              error={registerForm.formState.errors.full_name?.message}
            >
              <Input autoComplete="name" {...registerForm.register("full_name")} />
            </Field>
            <Field label={appCopy.auth.emailLabel} error={registerForm.formState.errors.email?.message}>
              <Input
                type="email"
                autoComplete="email"
                {...registerForm.register("email")}
              />
            </Field>
            <Field
              label={appCopy.auth.passwordLabel}
              error={registerForm.formState.errors.password?.message}
            >
              <Input
                type="password"
                autoComplete="new-password"
                {...registerForm.register("password")}
              />
            </Field>
            <Field
              label={appCopy.auth.localeLabel}
              error={registerForm.formState.errors.preferred_locale?.message}
            >
              <Select {...registerForm.register("preferred_locale")}>
                {supportedLocales.map((supportedLocale) => (
                  <option key={supportedLocale} value={supportedLocale}>
                    {localeMessages.locales[supportedLocale]}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" disabled={registerForm.formState.isSubmitting}>
              {registerForm.formState.isSubmitting
                ? appCopy.common.loading
                : appCopy.auth.registerAction}
            </Button>
            <p className="text-sm text-muted-foreground">
              {appCopy.auth.switchToSignIn}{" "}
              <button
                type="button"
                className="font-semibold text-primary"
                onClick={() => setMode("sign-in")}
              >
                {appCopy.auth.signInTitle}
              </button>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
