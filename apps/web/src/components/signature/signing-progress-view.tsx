"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@mpa/ui";

type ProgressPayload = {
  recipient: { fullName: string; role: string; status: string; signingUrl: string | null };
  package: { packageNumber: string; status: string; documentType: string };
  progress: Array<{ key: string; label: string; status: string }>;
  documents: Array<{ title: string; contentText: string | null }>;
};

export function SigningProgressView({ token }: { token: string }) {
  const [data, setData] = useState<ProgressPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await fetch(`/api/signing/progress/${token}`, { method: "POST" });
          const res = await fetch(`/api/signing/progress/${token}`, { cache: "no-store" });
          const json = (await res.json()) as ProgressPayload & { error?: { message?: string } };
          if (!res.ok) throw new Error(json.error?.message ?? "Signing link unavailable");
          setData(json);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load signing progress");
        } finally {
          setLoading(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [token]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4">
        <Card className="w-full space-y-2 p-6">
          <h1 className="text-xl font-semibold">Electronic signature</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading…</p>
        </Card>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-4">
        <Card className="w-full space-y-2 p-6">
          <h1 className="text-xl font-semibold">Signing unavailable</h1>
          <p className="text-sm text-[var(--mpa-color-danger)]">{error ?? "Link not found"}</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
      <Card className="w-full space-y-4 p-6">
        <div>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">My Property Assistant</p>
          <h1 className="text-2xl font-semibold">Sign {data.package.packageNumber}</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {data.recipient.fullName} · {data.recipient.role.replaceAll("_", " ")}
          </p>
        </div>

        <div className="grid gap-2">
          {data.progress.map((step) => (
            <div key={step.key} className="rounded-md border border-[var(--mpa-color-border)] p-3 text-sm">
              <div className="font-medium">{step.label}</div>
              <div className="text-[var(--mpa-color-text-secondary)]">{step.status}</div>
            </div>
          ))}
        </div>

        {data.documents[0]?.contentText ? (
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--mpa-color-border)] p-3 text-xs">
            {data.documents[0].contentText}
          </pre>
        ) : null}

        {data.recipient.signingUrl ? (
          <a href={data.recipient.signingUrl} target="_blank" rel="noreferrer">
            <Button className="w-full">Continue signing</Button>
          </a>
        ) : (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Waiting for invitation. Status: {data.recipient.status}
          </p>
        )}

        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          Package status: {data.package.status}. Mobile-friendly progress is owned by M.P.A.; the provider hosts the
          signature ceremony.
        </p>
      </Card>
    </main>
  );
}
