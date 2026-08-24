"use client";

import { Alert, Button, Input } from "@mpa/ui";
import { MIN_PASSWORD_LENGTH, SKU_SUMMARIES, type ProductSku } from "@mpa/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MarketingChrome,
  marketingNarrowMainClass,
  marketingPrimaryCtaClass
} from "../marketing/marketing-chrome";

type Preview = {
  email: string;
  productSku: ProductSku;
  grantType: "tester" | "gift";
  expiresAt: string | null;
  status: string;
};

export function ComplimentaryClaimPage({
  token,
  isAuthenticated,
  userEmail
}: {
  token: string | null;
  isAuthenticated: boolean;
  userEmail: string | null;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void fetch(`/api/complimentary/claim?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const payload = (await response.json()) as Preview & { error?: string };
        if (cancelled) return;
        if (!response.ok) {
          setError(payload.error ?? "This claim link is invalid or expired.");
          return;
        }
        setPreview(payload);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load this claim link.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function claim() {
    if (!token) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/complimentary/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        ...(password.length >= MIN_PASSWORD_LENGTH ? { password } : {})
      })
    });
    const payload = (await response.json()) as { error?: string; nextPath?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Unable to set up this account.");
      return;
    }
    router.push(payload.nextPath ?? "/setup");
  }

  const productLabel = preview ? SKU_SUMMARIES[preview.productSku].label : "M.P.A.";

  return (
    <MarketingChrome>
      <main className={marketingNarrowMainClass}>
        <h1 className="font-display text-3xl font-semibold">Set up your complimentary access</h1>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          No payment is required. Create your password or sign in with the invited email, then continue
          Guided Setup.
        </p>
        {preview ? (
          <p className="mt-4 text-sm">
            {preview.grantType === "tester" ? "Tester" : "Gift"} access to <strong>{productLabel}</strong>
            {preview.expiresAt ? ` · expires ${preview.expiresAt.slice(0, 10)}` : " · no expiration"}
            {preview.email ? ` · ${preview.email}` : ""}
          </p>
        ) : null}
        {error ? (
          <Alert className="mt-4" variant="danger">
            {error}
          </Alert>
        ) : null}
        {!token ? (
          <p className="mt-4 text-sm">This link is missing a claim token.</p>
        ) : (
          <form
            className="mt-6 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void claim();
            }}
          >
            {!isAuthenticated || (userEmail && preview && userEmail.toLowerCase() !== preview.email) ? (
              <label className="block text-sm">
                Create a password
                <Input
                  type="password"
                  minLength={MIN_PASSWORD_LENGTH}
                  required={!isAuthenticated}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1"
                />
              </label>
            ) : (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Signed in as {userEmail}. Continue to claim this access.
              </p>
            )}
            <Button type="submit" className={marketingPrimaryCtaClass} disabled={busy || !preview}>
              Set Up Your Account
            </Button>
          </form>
        )}
      </main>
    </MarketingChrome>
  );
}
