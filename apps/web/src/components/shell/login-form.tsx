"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@mpa/ui";
import { createAuthClient } from "../../lib/auth/client";

type AuthMode = "sign_in" | "sign_up";

export function LoginForm() {
  const router = useRouter();
  const supabase = createAuthClient();
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === "sign_up" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    if (mode === "sign_up") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setNotice("Account created. Check your inbox for verification, then sign in.");
      setMode("sign_in");
      setPassword("");
      setConfirmPassword("");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <Card className="w-full max-w-md shadow-mpa-md">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
        {mode === "sign_in" ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-1 text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
        {mode === "sign_in"
          ? "Enter your credentials to continue to your workspace."
          : "Create a foundation account, then verify your email to continue."}
      </p>
      <div
        className="mt-5 grid grid-cols-2 gap-1 rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-bg-surface-muted)] p-1"
        role="tablist"
        aria-label="Authentication mode"
      >
        <Button
          type="button"
          variant={mode === "sign_in" ? "primary" : "ghost"}
          onClick={() => {
            setMode("sign_in");
            setError(null);
            setNotice(null);
          }}
        >
          Sign in
        </Button>
        <Button
          type="button"
          variant={mode === "sign_up" ? "primary" : "ghost"}
          onClick={() => {
            setMode("sign_up");
            setError(null);
            setNotice(null);
          }}
        >
          Sign up
        </Button>
      </div>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--mpa-color-text-secondary)]" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--mpa-color-text-secondary)]" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "sign_in" ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {mode === "sign_up" ? (
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-[var(--mpa-color-text-secondary)]"
              htmlFor="confirm-password"
            >
              Confirm password
            </label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        ) : null}
        {error ? (
          <p className="text-sm text-[var(--mpa-color-text-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="text-sm text-[var(--mpa-color-status-success)]" role="status">
            {notice}
          </p>
        ) : null}
        <Button className="w-full" disabled={loading} type="submit">
          {loading
            ? mode === "sign_in"
              ? "Signing in..."
              : "Creating account..."
            : mode === "sign_in"
              ? "Sign in"
              : "Create account"}
        </Button>
        {mode === "sign_in" ? (
          <p className="text-center text-sm text-[var(--mpa-color-text-secondary)]">
            <Link
              className="font-medium text-[var(--mpa-color-text-link)] underline-offset-4 hover:underline"
              href="/forgot-password"
            >
              Forgot your password?
            </Link>
          </p>
        ) : null}
      </form>
    </Card>
  );
}
