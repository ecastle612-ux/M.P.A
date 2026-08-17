"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, FormField, Input, Select, useToast } from "@mpa/ui";

type LeaseOption = {
  id: string;
  status: string;
  start_date: string;
  property_properties?: { name: string } | null;
  property_units?: { unit_label: string } | null;
};

export function AddTenantForm({ onDone }: { onDone?: () => void }) {
  const { notify } = useToast();
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
      const confirmation = `Invitation ready for ${body.confirmation?.tenantName ?? "tenant"} at ${body.confirmation?.propertyName ?? "property"} · Unit ${body.confirmation?.unitLabel ?? "—"}.`;
      setResult(confirmation);
      notify({
        variant: "success",
        title: "Tenant added",
        description: "Invitation sent. They can accept from email and open Tenant Portal in the browser."
      });
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
      className="space-y-4 rounded-lg border border-[var(--mpa-color-border-default)] bg-white p-5 shadow-[0_1px_0_rgba(18,21,26,0.04)]"
    >
      <header className="space-y-1">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          Add Tenant
        </h2>
        <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          Enter the resident’s name and email. M.P.A. sends the invitation and keeps the lease
          relationship on the server.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="tenant-first-name" label="First name" required>
          <Input
            id="tenant-first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
            autoComplete="given-name"
          />
        </FormField>
        <FormField id="tenant-last-name" label="Last name" required>
          <Input
            id="tenant-last-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
            autoComplete="family-name"
          />
        </FormField>
      </div>
      <FormField
        id="tenant-email"
        label="Email"
        required
        hint="The invitation is sent to this address."
      >
        <Input
          id="tenant-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />
      </FormField>
      <FormField
        id="tenant-lease"
        label="Lease"
        required
        hint="Choose the property and unit this resident should join."
      >
        <Select
          id="tenant-lease"
          value={leaseId}
          onChange={(event) => setLeaseId(event.target.value)}
          required
        >
          {leases.length === 0 ? <option value="">No active leases yet</option> : null}
          {leases.map((lease) => (
            <option key={lease.id} value={lease.id}>
              {lease.property_properties?.name ?? "Property"} · Unit {lease.property_units?.unit_label ?? "—"}
            </option>
          ))}
        </Select>
      </FormField>
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {result ? <Alert variant="success">{result}</Alert> : null}
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="submit" disabled={busy || !leaseId}>
          {busy ? "Sending…" : "Add Tenant"}
        </Button>
      </div>
    </form>
  );
}
