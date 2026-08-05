"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Card, Input } from "@mpa/ui";
import { createAuthClient } from "../../lib/auth/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createAuthClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotice("Password updated. Redirecting to sign in...");
    window.setTimeout(() => {
      router.replace("/login");
    }, 800);
  }

  return (
    <Card className="w-full max-w-md shadow-mpa-md">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
        Set a new password
      </h1>
      <p className="mt-1 text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
        Complete your password reset with a new secure password.
      </p>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--mpa-color-text-secondary)]" htmlFor="password">
            New password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
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
          {loading ? "Updating..." : "Update password"}
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
