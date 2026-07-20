"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button, Card, Input } from "@mpa/ui";
import { createAuthClient } from "../../lib/auth/client";
import {
  detectRecoveryFlow,
  parseRecoveryParams,
  stripRecoveryParamsFromUrl
} from "../../lib/auth/password-recovery";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createAuthClient(), []);
  const hasInitializedRecovery = useRef(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (hasInitializedRecovery.current) return;
    hasInitializedRecovery.current = true;

    let active = true;

    async function establishRecoverySession() {
      const recoveryParams = parseRecoveryParams(window.location.search, window.location.hash);
      const recoveryFlow = detectRecoveryFlow(recoveryParams);

      try {
        if (recoveryParams.errorDescription || recoveryParams.error || recoveryParams.errorCode) {
          throw new Error(
            recoveryParams.errorDescription ??
              "Reset link is invalid or expired. Request a new password reset email."
          );
        }

        // Middleware may already have exchanged ?code= and cleaned the URL.
        // Client still handles hash tokens / token_hash / leftover code as fallback.
        if (recoveryFlow === "code" && recoveryParams.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(recoveryParams.code);
          if (exchangeError) throw exchangeError;
        } else if (
          recoveryFlow === "session_tokens" &&
          recoveryParams.accessToken &&
          recoveryParams.refreshToken
        ) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: recoveryParams.accessToken,
            refresh_token: recoveryParams.refreshToken
          });
          if (setSessionError) throw setSessionError;
        } else if (recoveryFlow === "token_hash" && recoveryParams.tokenHash) {
          const { error: verifyOtpError } = await supabase.auth.verifyOtp({
            token_hash: recoveryParams.tokenHash,
            type: "recovery"
          });
          if (verifyOtpError) throw verifyOtpError;
        }

        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) {
          throw new Error(
            recoveryParams.errorDescription ??
              "Recovery session missing or expired. Request a new password reset email."
          );
        }

        if (!active) return;
        setSessionReady(true);
      } catch (recoveryError) {
        if (!active) return;
        const message =
          recoveryError instanceof Error
            ? recoveryError.message
            : "Unable to verify your reset link. Request a new password reset email.";
        setError(message);
        setSessionReady(false);
      } finally {
        const cleanPath = stripRecoveryParamsFromUrl(new URL(window.location.href));
        window.history.replaceState({}, document.title, cleanPath);
        if (active) setSessionLoading(false);
      }
    }

    void establishRecoverySession();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!sessionReady) {
      setError("Recovery session missing or expired. Request a new password reset email.");
      return;
    }

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

    await supabase.auth.signOut();
    setNotice("Password updated. Redirecting to sign in...");
    window.setTimeout(() => {
      router.replace("/login");
    }, 800);
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
        Set a new password
      </h1>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
        Complete your password reset with a new secure password.
      </p>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        {sessionLoading ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Verifying reset link...</p>
        ) : null}
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="password">
            New password
          </label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="confirm-password">
            Confirm password
          </label>
          <Input
            id="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
        {notice ? <p className="text-sm text-[var(--mpa-color-brand-primary)]">{notice}</p> : null}
        <Button className="w-full" disabled={loading || sessionLoading || !sessionReady} type="submit">
          {sessionLoading ? "Verifying link..." : loading ? "Updating..." : "Update password"}
        </Button>
        <p className="text-center text-sm text-[var(--mpa-color-text-secondary)]">
          <Link className="underline" href="/login">
            Back to sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}
