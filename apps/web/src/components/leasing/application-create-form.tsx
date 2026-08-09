"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Input, Select } from "@mpa/ui";

type PropertyOption = {
  id: string;
  name: string;
  property_units?: Array<{ id: string; unit_label: string; status: string }>;
};

type ApplicationCreateFormProps = {
  onCreated: () => void;
};

export function ApplicationCreateForm({ onCreated }: ApplicationCreateFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [asProspect, setAsProspect] = useState(false);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/pm/properties");
        const body = (await response.json()) as {
          properties?: PropertyOption[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? "Unable to load properties.");
        }
        if (!cancelled) {
          const list = body.properties ?? [];
          setProperties(list);
          if (list[0]) {
            setPropertyId(list[0].id);
            const firstUnit = list[0].property_units?.[0];
            if (firstUnit) setUnitId(firstUnit.id);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load properties.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const units = useMemo(() => {
    const property = properties.find((p) => p.id === propertyId);
    return property?.property_units ?? [];
  }, [properties, propertyId]);

  const effectiveUnitId = units.some((u) => u.id === unitId) ? unitId : (units[0]?.id ?? "");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/pm/leasing/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: asProspect ? "prospect" : "application",
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          propertyId,
          unitId: effectiveUnitId || undefined
        })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to create.");
      }
      setFirstName("");
      setLastName("");
      setEmail("");
      setOpen(false);
      onCreated();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          Add prospect or application
        </Button>
      </div>
    );
  }

  return (
    <section className="max-w-xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
      <header className="space-y-1">
        <h3 className="font-display text-base font-semibold text-[var(--mpa-color-text-primary)]">
          Start leasing person
        </h3>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          One person record per email. Prospect first, or open an application immediately.
        </p>
      </header>
      {loading ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading properties…</p> : null}
      {error ? (
        <p className="text-sm text-[var(--mpa-color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="app-first">
              First name
            </label>
            <Input
              id="app-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="app-last">
              Last name
            </label>
            <Input
              id="app-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="app-email">
            Email
          </label>
          <Input
            id="app-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="app-property">
            Property
          </label>
          <Select
            id="app-property"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            required
          >
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="app-unit">
            Unit
          </label>
          <Select
            id="app-unit"
            value={effectiveUnitId}
            onChange={(e) => setUnitId(e.target.value)}
            required
          >
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                Unit {unit.unit_label}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
          <input
            type="checkbox"
            checked={asProspect}
            onChange={(e) => setAsProspect(e.target.checked)}
          />
          Save as prospect only (no application yet)
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy || loading || !effectiveUnitId}>
            {busy ? "Saving…" : asProspect ? "Create prospect" : "Create application"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
