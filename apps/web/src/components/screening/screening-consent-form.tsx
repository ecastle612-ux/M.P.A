"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input } from "@mpa/ui";

type ConsentPayload = {
  alreadyGranted: boolean;
  party: { fullName: string; role: string };
  case: { caseNumber: string; packageCode: string } | null;
  disclosure: {
    title: string;
    body: string;
    authorization: string;
    version: number;
  } | null;
};

export function ScreeningConsentForm({ token }: { token: string }) {
  const [data, setData] = useState<ConsentPayload | null>(null);
  const [signedName, setSignedName] = useState("");
  const [disclosure, setDisclosure] = useState(false);
  const [authorization, setAuthorization] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/screening/consent/${token}`, { cache: "no-store" });
        const json = (await res.json()) as ConsentPayload & { error?: { message?: string } };
        if (!res.ok) throw new Error(json.error?.message ?? "Consent link unavailable");
        setData(json);
        if (json.alreadyGranted) setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load consent");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/screening/consent/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedName,
          attestedDisclosure: disclosure,
          attestedAuthorization: authorization
        })
      });
      const json = (await res.json()) as { error?: { message?: string }; submitted?: boolean };
      if (!res.ok) throw new Error(json.error?.message ?? "Consent failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Consent failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <Card className="mx-auto max-w-xl p-6">Loading authorization…</Card>;
  }

  if (error && !data) {
    return (
      <Card className="mx-auto max-w-xl space-y-2 p-6">
        <h1 className="text-xl font-semibold">Consent unavailable</h1>
        <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-xl space-y-3 p-6">
        <h1 className="text-xl font-semibold">Authorization received</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Thank you. Your screening consent has been recorded. The property manager will continue the review process.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl space-y-4 p-6">
      <div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Background screening authorization</p>
        <h1 className="text-2xl font-semibold">{data?.disclosure?.title ?? "Screening disclosure"}</h1>
        <p className="mt-1 text-sm">
          {data?.party.fullName} · {data?.party.role}
          {data?.case ? ` · ${data.case.caseNumber}` : null}
        </p>
      </div>

      <section className="space-y-2 text-sm">
        <h2 className="font-semibold">Disclosure (v{data?.disclosure?.version ?? 1})</h2>
        <p className="whitespace-pre-wrap text-[var(--mpa-color-text-secondary)]">{data?.disclosure?.body}</p>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-semibold">Authorization</h2>
        <p className="whitespace-pre-wrap text-[var(--mpa-color-text-secondary)]">
          {data?.disclosure?.authorization}
        </p>
      </section>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={disclosure} onChange={(event) => setDisclosure(event.target.checked)} />
        <span>I have read and understand the disclosure.</span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={authorization}
          onChange={(event) => setAuthorization(event.target.checked)}
        />
        <span>I authorize consumer reports for rental screening purposes.</span>
      </label>

      <Input
        value={signedName}
        onChange={(event) => setSignedName(event.target.value)}
        placeholder="Type your full legal name"
        aria-label="Signed name"
      />

      {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}

      <Button onClick={() => void submit()} disabled={busy || !disclosure || !authorization || !signedName.trim()}>
        Submit electronic authorization
      </Button>
    </Card>
  );
}
