"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useActionState, type FormEvent } from "react";
import { Button, Card, Input } from "@mpa/ui/auth";
import { createAuthClient } from "../../lib/auth/client";
import {
  authenticatedPasswordChangeAction,
  type LoginActionState
} from "../../lib/auth/login-actions";
import {
  detectRecoveryFlow,
  parseRecoveryParams,
  stripRecoveryParamsFromUrl
} from "../../lib/auth/password-recovery";

const initialState: LoginActionState = {};

/**
 * AUTH-001 Slice A — recovery password change through Identity Adapter after session establish.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createAuthClient(), []);
  const hasInitializedRecovery = useRef(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(authenticatedPasswordChangeAction, initialState);

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
          error: sessionErrorValue
        } = await supabase.auth.getSession();

        if (sessionErrorValue) throw sessionErrorValue;
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
        setSessionError(message);
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

  useEffect(() => {
    if (!state.notice) return;
    const timer = window.setTimeout(() => {
      router.replace("/login");
    }, 800);
    return () => window.clearTimeout(timer);
  }, [state.notice, router]);

  function handleInvalidSessionSubmit(event: FormEvent<HTMLFormElement>) {
    if (!sessionReady) {
      event.preventDefault();
    }
  }

  const error = sessionError ?? state.error ?? null;

  return (
    <Card className="w-full max-w-md">
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
        Set a new password
      </h1>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
        Complete your password reset with a new secure password (at least 12 characters).
      </p>
      <form className="mt-4 space-y-3" action={formAction} onSubmit={handleInvalidSessionSubmit}>
        {sessionLoading ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Verifying reset link...</p>
        ) : null}
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="password">
            New password
          </label>
          <Input id="password" name="password" type="password" required minLength={12} />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="confirmPassword">
            Confirm password
          </label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={12} />
        </div>
        {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
        {state.notice ? (
          <p className="text-sm text-[var(--mpa-color-brand-primary)]">{state.notice}</p>
        ) : null}
        <Button className="w-full" disabled={pending || sessionLoading || !sessionReady} type="submit">
          {sessionLoading ? "Verifying link..." : pending ? "Updating..." : "Update password"}
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
