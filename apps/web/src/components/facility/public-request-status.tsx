"use client";

import { useEffect, useState } from "react";
import { Alert } from "@mpa/ui";

export function PublicRequestStatus({ statusToken }: { statusToken: string }) {
  const [view, setView] = useState<{
    requestNumber: string;
    submittedAt: string;
    title: string;
    category: string | null;
    location: string | null;
    statusLabel: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/public/request/status/${statusToken}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "This tracking link is no longer available.");
        setView(body);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load status."));
  }, [statusToken]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!view) return <p>Loading request status…</p>;

  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-semibold">Request status</h1>
      <p className="text-lg font-semibold">{view.requestNumber}</p>
      <p>{view.title}</p>
      {view.category ? <p>{view.category}</p> : null}
      {view.location ? <p>{view.location}</p> : null}
      <p>{view.statusLabel}</p>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        {new Date(view.submittedAt).toLocaleString()}
      </p>
    </div>
  );
}
