"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@mpa/ui";
import type { CommunicationTimelineEntry } from "../../lib/commercial/timeline";

type Props = {
  organizationId: string;
  canAddNote?: boolean;
};

export function CommunicationTimelinePanel({
  organizationId,
  canAddNote = false
}: Props) {
  const [entries, setEntries] = useState<CommunicationTimelineEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/communication-timeline?limit=30`,
      { cache: "no-store" }
    );
    const payload = (await response.json()) as {
      entries?: CommunicationTimelineEntry[];
      message?: string;
      error?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Unable to load timeline");
      return;
    }
    setEntries(payload.entries ?? []);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addNote() {
    if (!note.trim()) return;
    setLoading(true);
    const response = await fetch(
      `/api/organizations/${organizationId}/communication-timeline`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "call_note",
          entryType: "customer_success_check_in",
          templateKey: "cs.manual_note",
          direction: "inbound_note",
          summary: note.trim()
        })
      }
    );
    const payload = (await response.json()) as { message?: string; error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Failed to add note");
      return;
    }
    setNote("");
    await load();
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            Communication timeline
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Commercial and success communications for this organization.
          </p>
        </div>
        <Button type="button" variant="secondary" disabled={loading} onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{error}</p>
      ) : null}

      {canAddNote ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="CS note"
            className="h-10 flex-1 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 text-sm text-[var(--mpa-color-text-primary)]"
            placeholder="Add CS check-in note (secret-free)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button type="button" disabled={loading || !note.trim()} onClick={() => void addNote()}>
            Add note
          </Button>
        </div>
      ) : null}

      <ul className="divide-y divide-[var(--mpa-color-border-default)]">
        {entries.map((entry) => (
          <li key={entry.id} className="py-3 text-sm">
            <p className="font-medium text-[var(--mpa-color-text-primary)]">
              {entry.entryType}{" "}
              <span className="text-[var(--mpa-color-text-muted)]">· {entry.channel}</span>
            </p>
            <p className="text-[var(--mpa-color-text-secondary)]">{entry.summary}</p>
            <p className="mt-1 text-xs text-[var(--mpa-color-text-muted)]">
              {entry.occurredAt} · {entry.deliveryStatus}
            </p>
          </li>
        ))}
        {entries.length === 0 ? (
          <li className="py-3 text-sm text-[var(--mpa-color-text-muted)]">
            No commercial communications logged yet.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}
