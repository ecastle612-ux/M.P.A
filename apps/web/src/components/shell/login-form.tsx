"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SKU_SUMMARIES, parseAcquisitionSku } from "@mpa/shared";
import { Button, Card, Input } from "@mpa/ui";
import { createAuthClient } from "../../lib/auth/client";

type AuthMode = "sign_in" | "sign_up";

function safeNextPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
}

function commerceContinuePath(sessionId: string, bindToken: string | null): string {
  const base = `/commerce/continue?session_id=${encodeURIComponent(sessionId)}`;
  return bindToken ? `${base}&bind_token=${encodeURIComponent(bindToken)}` : base;
}

/** Presentation-only — does not change claim-password API contracts. */
function friendlyCommerceClaimError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("email_mismatch") || (lower.includes("email") && lower.includes("mismatch"))) {
    return "Use the same email address from your Stripe purchase receipt, then try again.";
  }
  if (lower.includes("expired") || lower.includes("invalid") || lower.includes("used")) {
    return "This claim link is no longer valid. Open your purchase email again, or recover access from Sign in.";
  }
  if (lower.includes("password") && (lower.includes("weak") || lower.includes("short") || lower.includes("least"))) {
    return "Choose a stronger password (at least 8 characters), then try again.";
  }
  if (lower.includes("already") && (lower.includes("claim") || lower.includes("bound"))) {
    return "This workspace may already be claimed. Sign in with your purchase email and password.";
  }
  if (lower.includes("session") && (lower.includes("not found") || lower.includes("missing"))) {
    return "We could not find this purchase session. Open the link from your confirmation email.";
  }
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const saasCheckoutSession = searchParams.get("saas_checkout_session");
  const bindToken = searchParams.get("bind_token");
  const commerceNext =
    saasCheckoutSession && saasCheckoutSession.length > 0
      ? commerceContinuePath(saasCheckoutSession, bindToken)
      : null;
  const initialMode: AuthMode = searchParams.get("mode") === "sign_up" ? "sign_up" : "sign_in";
  const selectedSku = parseAcquisitionSku(searchParams.get("intent"));
  const selectedPlanLabel = selectedSku ? SKU_SUMMARIES[selectedSku].label : null;
  const supabase = createAuthClient();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** After commerce auth, bind owner immediately — avoids SSR cookie race on /commerce/continue. */
  async function claimCommerceWorkspace(sessionId: string): Promise<string | null> {
    const res = await fetch("/api/commerce/provision/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId,
        ...(bindToken ? { bindToken } : {})
      })
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; nextPath?: string };
    if (!res.ok) {
      return friendlyCommerceClaimError(data.error ?? "Could not claim workspace.");
    }
    window.location.assign(data.nextPath ?? "/setup");
    return null;
  }

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
      // COM-002: provisioning already created the auth user — set password + confirm email, then sign in.
      if (saasCheckoutSession) {
        const claimRes = await fetch("/api/commerce/provision/claim-password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId: saasCheckoutSession,
            email,
            password,
            ...(bindToken ? { bindToken } : {})
          })
        });
        const claimData = (await claimRes.json().catch(() => ({}))) as { error?: string };
        if (!claimRes.ok) {
          setLoading(false);
          setError(
            friendlyCommerceClaimError(claimData.error ?? "Could not verify purchase email.")
          );
          return;
        }
        const { error: signInAfterClaim } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInAfterClaim) {
          setLoading(false);
          setError(friendlyCommerceClaimError(signInAfterClaim.message));
          return;
        }
        const claimError = await claimCommerceWorkspace(saasCheckoutSession);
        setLoading(false);
        if (claimError) setError(friendlyCommerceClaimError(claimError));
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setNotice(
        nextPath
          ? "Account created. Verify your email if required, then sign in to accept your invitation."
          : "Account created. Check your inbox for verification, then sign in."
      );
      setMode("sign_in");
      setPassword("");
      setConfirmPassword("");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    if (saasCheckoutSession) {
      const claimError = await claimCommerceWorkspace(saasCheckoutSession);
      setLoading(false);
      if (claimError) setError(claimError);
      return;
    }

    setLoading(false);
    router.replace(nextPath ?? "/dashboard");
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
        {commerceNext
          ? mode === "sign_up"
            ? "Set your password"
            : "Sign in to claim your workspace"
          : mode === "sign_in"
            ? "Sign in to M.P.A."
            : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
        {commerceNext
          ? "Use the same email from your Stripe purchase. Set a password to claim admin access, then continue Guided Setup."
          : nextPath
            ? "Sign in with the invited email, then continue to accept your invitation."
            : mode === "sign_in"
              ? "Welcome back. After you sign in, continue Guided Setup or open your workspace."
              : "Verify your email, then sign in to create your organization."}
      </p>
      {commerceNext ? (
        <p className="mt-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Next: set password → claim workspace → Guided Setup → Mission Control. Your organization is
          prepared automatically from checkout.
        </p>
      ) : null}
      {selectedPlanLabel && mode === "sign_up" && !commerceNext ? (
        <p className="mt-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Your selected plan,{" "}
          <span className="font-semibold text-[var(--mpa-color-text-primary)]">{selectedPlanLabel}</span>
          , is saved. Create your account to continue Guided Setup. Enterprise pricing and billing are
          finalized during onboarding.
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={mode === "sign_in" ? "primary" : "secondary"}
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
          variant={mode === "sign_up" ? "primary" : "secondary"}
          onClick={() => {
            setMode("sign_up");
            setError(null);
            setNotice(null);
          }}
        >
          Sign up
        </Button>
      </div>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {mode === "sign_up" ? (
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
        ) : null}
        {error ? (
          <p
            className="rounded-md border border-[#C0392B]/40 bg-[#FCE8E6] px-3 py-2 text-sm text-[#C0392B]"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        ) : null}
        {notice ? (
          <p
            className="rounded-md border border-[#0F6B56]/30 bg-[#E6F4EF] px-3 py-2 text-sm text-[#0F6B56]"
            role="status"
            aria-live="polite"
          >
            {notice}
          </p>
        ) : null}
        <Button className="w-full" disabled={loading} aria-busy={loading} type="submit">
          {loading
            ? commerceNext
              ? mode === "sign_up"
                ? "Setting password…"
                : "Claiming workspace…"
              : mode === "sign_in"
                ? "Signing in…"
                : "Creating account…"
            : commerceNext
              ? mode === "sign_up"
                ? "Set password & continue"
                : "Sign in & claim workspace"
              : mode === "sign_in"
                ? "Sign in"
                : "Create account"}
        </Button>
        {mode === "sign_in" ? (
          <p className="text-center text-sm text-[var(--mpa-color-text-secondary)]">
            <Link className="underline" href="/forgot-password">
              Forgot your password?
            </Link>
          </p>
        ) : (
          <p className="text-center text-sm text-[var(--mpa-color-text-secondary)]">
            Prefer self-service purchase first?{" "}
            <Link className="underline" href="/modules">
              Choose Your Platform
            </Link>
          </p>
        )}
      </form>
    </Card>
  );
}
