"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@mpa/ui/auth";

export function VerifyContactCard({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const response = await fetch("/api/contact-verification/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token })
      });
      const payload = (await response.json()) as { error?: string };
      if (cancelled) return;
      if (!response.ok) {
        setStatus("error");
        setError(payload.error ?? "Verification failed.");
        return;
      }
      setStatus("ok");
      window.setTimeout(() => router.replace("/dashboard"), 900);
    })().catch(() => {
      if (!cancelled) {
        setStatus("error");
        setError("Verification failed.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <Card className="w-full max-w-md space-y-3">
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
        Verify contact email
      </h1>
      {status === "loading" ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Confirming your contact email…</p>
      ) : null}
      {status === "ok" ? (
        <p className="text-sm text-[var(--mpa-color-brand-primary)]">
          Contact email verified. Redirecting…
        </p>
      ) : null}
      {status === "error" ? (
        <>
          <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p>
          <Button onClick={() => router.replace("/login")}>Back to sign in</Button>
        </>
      ) : null}
    </Card>
  );
}
