"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, Card, Input } from "@mpa/ui";
import { createAuthClient } from "../../lib/auth/client";

export function ForgotPasswordForm() {
  const supabase = createAuthClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const origin = window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setNotice("Password reset link sent. Check your inbox.");
  }

  return (
    <Card className="w-full max-w-md shadow-mpa-md">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
        Reset password
      </h1>
      <p className="mt-1 text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
        We will send a secure reset link to your email.
      </p>

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
          {loading ? "Sending link..." : "Send reset link"}
        </Button>
        <p className="text-center text-sm text-[var(--mpa-color-text-secondary)]">
          <Link
            className="font-medium text-[var(--mpa-color-text-link)] underline-offset-4 hover:underline"
            href="/login"
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
