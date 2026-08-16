"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Select } from "@mpa/ui";

type LeaseOption = {
  id: string;
  status: string;
  start_date: string;
  property_properties?: { name: string } | null;
  property_units?: { unit_label: string } | null;
};

export function AddTenantForm({ onDone }: { onDone?: () => void }) {
  const [leases, setLeases] = useState<LeaseOption[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [leaseId, setLeaseId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/pm/leasing");
      const body = (await response.json()) as { leases?: LeaseOption[]; error?: string };
      if (response.ok) {
        const active = (body.leases ?? []).filter((lease) => lease.status !== "ended");
        setLeases(active);
        if (active[0]) setLeaseId(active[0].id);
      }
    })();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/pm/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, leaseId })
      });
      const body = (await response.json()) as {
        error?: string;
        confirmation?: { tenantName: string; propertyName: string; unitLabel: string };
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not add tenant");
      }
      setResult(
        `Invitation ready for ${body.confirmation?.tenantName ?? "tenant"} at ${body.confirmation?.propertyName ?? "property"} · Unit ${body.confirmation?.unitLabel ?? "—"}.`
      );
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add tenant");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      className="space-y-3 rounded-2xl border border-[var(--mpa-color-border-default)] p-4"
    >
      <h2 className="text-base font-semibold">Add Tenant</h2>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Enter the resident’s name and email. M.P.A. sends the invitation and keeps the lease
        relationship on the server.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>First name</span>
          <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
        </label>
        <label className="space-y-1 text-sm">
          <span>Last name</span>
          <Input value={lastName} onChange={(event) => setLastName(event.target.value)} required />
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span>Email</span>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Lease</span>
        <Select value={leaseId} onChange={(event) => setLeaseId(event.target.value)} required>
          {leases.map((lease) => (
            <option key={lease.id} value={lease.id}>
              {lease.property_properties?.name ?? "Property"} · Unit {lease.property_units?.unit_label ?? "—"}
            </option>
          ))}
        </Select>
      </label>
      {error ? <p className="text-sm text-[var(--mpa-color-danger-text)]">{error}</p> : null}
      {result ? <p className="text-sm text-[var(--mpa-color-text-primary)]">{result}</p> : null}
      <Button type="submit" disabled={busy || !leaseId}>
        {busy ? "Sending…" : "Add Tenant"}
      </Button>
    </form>
  );
}
