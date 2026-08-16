"use client";

import { useState, type FormEvent } from "react";
import { Button, Input } from "@mpa/ui";

type Occupancy = {
  id: string;
  occupy_from: string;
  occupy_to: string | null;
  occupancy_status: string;
};

export function MoveOutPanel({
  occupancy,
  tenantName,
  propertyName,
  unitLabel,
  onDone
}: {
  occupancy: Occupancy;
  tenantName: string;
  propertyName: string;
  unitLabel: string;
  onDone?: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [occupyTo, setOccupyTo] = useState(occupancy.occupy_to ?? today);
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const alreadyMoved = occupancy.occupancy_status === "moved_out" && occupancy.occupy_to && occupancy.occupy_to < today;
  const futureDated = Boolean(occupancy.occupy_to && occupancy.occupy_to >= today);

  async function post(path: string, body?: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {})
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Request failed");
      }
      onDone?.();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onMoveOut(event: FormEvent) {
    event.preventDefault();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    const ok = await post(`/api/pm/tenants/occupancies/${occupancy.id}/move-out`, {
      occupyTo,
      note: note || undefined
    });
    if (ok) {
      setMessage("Move out recorded. Active property access ends after the effective date. History is kept.");
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--mpa-color-border)] p-4">
      <h2 className="text-base font-semibold">Move Out</h2>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Move out this resident? M.P.A. will end their active access to this property. Lease, payment,
        maintenance, and communication history stay in the record.
      </p>
      <dl className="grid gap-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--mpa-color-text-secondary)]">Tenant</dt>
          <dd>{tenantName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--mpa-color-text-secondary)]">Property</dt>
          <dd>{propertyName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--mpa-color-text-secondary)]">Unit</dt>
          <dd>{unitLabel}</dd>
        </div>
      </dl>
      {alreadyMoved ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void post(`/api/pm/tenants/occupancies/${occupancy.id}/correct-move-out`, {
              occupyTo: null,
              note: note || undefined
            }).then((ok) => {
              if (ok) setMessage("Move-out corrected. Occupancy is active again. The correction is audited.");
            });
          }}
        >
          <p className="text-sm">This resident has already moved out. Correction restores access without deleting history.</p>
          <label className="block space-y-1 text-sm">
            <span>Note</span>
            <Input value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <Button type="submit" disabled={busy} variant="secondary">
            Correct move-out
          </Button>
        </form>
      ) : (
        <form onSubmit={(event) => void onMoveOut(event)} className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span>Effective move-out date</span>
            <Input
              type="date"
              value={occupyTo}
              onChange={(event) => setOccupyTo(event.target.value)}
              required
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Note (optional)</span>
            <Input value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          {confirming ? (
            <p className="text-sm font-medium">
              Confirm move-out for {tenantName} at {propertyName} · Unit {unitLabel} on {occupyTo}?
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {confirming ? "Confirm Move Out" : "Move Out"}
            </Button>
            {futureDated ? (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void post(`/api/pm/tenants/occupancies/${occupancy.id}/cancel-move-out`).then((ok) => {
                    if (ok) setMessage("Future move-out cancelled.");
                  })
                }
              >
                Cancel scheduled move-out
              </Button>
            ) : null}
          </div>
        </form>
      )}
      {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}
      {message ? <p className="text-sm">{message}</p> : null}
    </section>
  );
}
