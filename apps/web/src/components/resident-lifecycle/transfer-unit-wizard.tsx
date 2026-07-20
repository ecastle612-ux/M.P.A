"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Select, useToast } from "@mpa/ui";
import type { TenantListItem } from "../../lib/tenant/server";
import { readApiError } from "../../lib/api/client-error";
import { Field } from "./field";

type UnitOption = {
  id: string;
  propertyId: string;
  unitNumber: string;
  unitLabel: string | null;
  occupancyStatus: string;
};

type PropertyOption = { id: string; name: string };

export function TransferUnitWizard({
  tenants,
  properties,
  units,
  canOverrideOccupied
}: {
  tenants: TenantListItem[];
  properties: PropertyOption[];
  units: UnitOption[];
  canOverrideOccupied: boolean;
}) {
  const { notify } = useToast();
  const [tenantId, setTenantId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [overrideOccupied, setOverrideOccupied] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const activeTenants = useMemo(
    () =>
      tenants.filter(
        (tenant) => tenant.lifecycleStatus !== "former" && tenant.status !== "archived" && Boolean(tenant.unitId)
      ),
    [tenants]
  );

  const selectedTenant = activeTenants.find((tenant) => tenant.id === tenantId) ?? null;
  const propertyUnits = useMemo(
    () => units.filter((unit) => unit.propertyId === propertyId && unit.id !== selectedTenant?.unitId),
    [units, propertyId, selectedTenant?.unitId]
  );
  const selectedUnit = propertyUnits.find((unit) => unit.id === unitId) ?? null;
  const occupied = selectedUnit?.occupancyStatus === "occupied";

  function onSelectTenant(nextId: string) {
    setTenantId(nextId);
    const tenant = activeTenants.find((item) => item.id === nextId);
    if (tenant?.propertyId) setPropertyId(tenant.propertyId);
    setUnitId("");
    setDone(false);
  }

  async function submit() {
    if (!tenantId || !propertyId || !unitId) {
      setError("Choose a resident and destination unit.");
      return;
    }
    if (occupied && !(overrideOccupied && canOverrideOccupied)) {
      setError("Destination unit is occupied. Enable override to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/resident-lifecycle/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          propertyId,
          unitId,
          overrideOccupied,
          reason: reason || null
        })
      });
      const json = (await response.json()) as unknown;
      if (!response.ok) throw new Error(readApiError(json, "Transfer failed"));
      setDone(true);
      notify({
        title: "Unit transfer complete",
        description: "Resident, lease, and occupancy were updated automatically.",
        variant: "success"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  if (done && selectedTenant) {
    return (
      <Card className="space-y-4">
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Transfer complete
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {selectedTenant.firstName} {selectedTenant.lastName} is linked to the new unit. Occupancy and lease
          assignment updated — no manual linking required.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/tenants/${selectedTenant.id}`}>
            <Button>View resident</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Operations Center</Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => {
              setDone(false);
              setUnitId("");
            }}
          >
            Transfer another
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Transfer unit
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Move an active resident to a different unit. Lease and occupancy update together.
        </p>
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}

      <Field label="Resident">
        <Select aria-label="Resident" value={tenantId} onChange={(event) => onSelectTenant(event.target.value)}>
          <option value="">Select resident…</option>
          {activeTenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.firstName} {tenant.lastName}
              {tenant.propertyName ? ` · ${tenant.propertyName}` : ""}
              {tenant.unitNumber ? ` · Unit ${tenant.unitNumber}` : ""}
            </option>
          ))}
        </Select>
      </Field>

      {selectedTenant ? (
        <div className="rounded-lg border border-[var(--mpa-color-border)] p-3 text-sm">
          Current: {selectedTenant.propertyName ?? "—"} · Unit {selectedTenant.unitNumber ?? "—"}
        </div>
      ) : null}

      <Field label="Destination property">
        <Select
          aria-label="Destination property"
          value={propertyId}
          onChange={(event) => {
            setPropertyId(event.target.value);
            setUnitId("");
          }}
        >
          <option value="">Select property…</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Destination unit">
        <Select
          aria-label="Destination unit"
          value={unitId}
          disabled={!propertyId}
          onChange={(event) => setUnitId(event.target.value)}
        >
          <option value="">Select unit…</option>
          {propertyUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.unitNumber}
              {unit.unitLabel ? ` · ${unit.unitLabel}` : ""} · {unit.occupancyStatus}
            </option>
          ))}
        </Select>
      </Field>

      {occupied ? (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={overrideOccupied}
            disabled={!canOverrideOccupied}
            onChange={(event) => setOverrideOccupied(event.target.checked)}
          />
          <span>
            Override occupied destination
            {!canOverrideOccupied ? " (requires lease update permission)" : ""}
          </span>
        </label>
      ) : null}

      <Field label="Reason (optional)">
        <Input aria-label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button disabled={loading || !tenantId || !unitId} onClick={() => void submit()}>
          {loading ? "Transferring…" : "Transfer resident"}
        </Button>
        <Link href="/residents/move-in">
          <Button variant="secondary">Move-in wizard</Button>
        </Link>
      </div>
    </Card>
  );
}
