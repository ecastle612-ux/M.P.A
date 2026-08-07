"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@mpa/ui";

type PropertyOption = {
  id: string;
  name: string;
  property_units?: Array<{ id: string; unit_label: string; status: string }>;
};

type ResidentCreateWizardProps = {
  onCancel?: () => void;
};

export function ResidentCreateWizard({ onCancel }: ResidentCreateWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            if (firstUnit) {
              setUnitId(firstUnit.id);
            }
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load properties.");
        }
      } finally {
        if (!cancelled) {
          setLoadingProperties(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === propertyId) ?? null,
    [properties, propertyId]
  );
  const units = useMemo(
    () => selectedProperty?.property_units ?? [],
    [selectedProperty]
  );
  const effectiveUnitId = units.some((unit) => unit.id === unitId)
    ? unitId
    : (units[0]?.id ?? "");

  async function onCreate(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/pm/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          propertyId,
          unitId: effectiveUnitId
        })
      });
      const payload = (await response.json()) as {
        resident?: { id: string };
        error?: string;
      };
      if (!response.ok || !payload.resident) {
        throw new Error(payload.error ?? "Unable to create resident.");
      }
      router.push(`/pm/residents/${payload.resident.id}?created=1`);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create resident.");
      setBusy(false);
    }
  }

  if (!loadingProperties && properties.length === 0) {
    return (
      <section
        aria-labelledby="resident-create-title"
        className="max-w-xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
      >
        <h2
          id="resident-create-title"
          className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Add your first resident
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Create a property with at least one unit before adding a resident.
        </p>
        <Button type="button" onClick={() => router.push("/pm/properties?new=1")}>
          Add property
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </section>
    );
  }

  return (
    <section
      aria-labelledby="resident-create-title"
      className="max-w-xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
    >
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Step {step} of 4
        </p>
        <h2
          id="resident-create-title"
          className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Add your first resident
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Launch-critical details only. Assign a property and unit so you can manage the full
          lifecycle next.
        </p>
      </header>

      {step === 1 ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!firstName.trim() || !lastName.trim() || !email.trim()) {
              setError("Enter first name, last name, and email.");
              return;
            }
            setError(null);
            setStep(2);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="first-name">
                First name
              </label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                autoFocus
                maxLength={80}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="last-name">
                Last name
              </label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                maxLength={80}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="resident-email">
              Email
            </label>
            <Input
              id="resident-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={254}
              autoComplete="email"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Continue</Button>
            {onCancel ? (
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!propertyId) {
              setError("Select a property.");
              return;
            }
            setError(null);
            setStep(3);
          }}
        >
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="property-id">
              Assign property
            </label>
            <Select
              id="property-id"
              value={propertyId}
              onChange={(event) => {
                const nextPropertyId = event.target.value;
                setPropertyId(nextPropertyId);
                const nextUnits =
                  properties.find((property) => property.id === nextPropertyId)?.property_units ??
                  [];
                setUnitId(nextUnits[0]?.id ?? "");
              }}
              required
              disabled={loadingProperties}
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!effectiveUnitId) {
              setError("Select a unit.");
              return;
            }
            setError(null);
            setStep(4);
          }}
        >
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="unit-id">
              Assign unit
            </label>
            <Select
              id="unit-id"
              value={effectiveUnitId}
              onChange={(event) => setUnitId(event.target.value)}
              required
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unit {unit.unit_label}
                </option>
              ))}
            </Select>
            {units.length === 0 ? (
              <p className="text-xs text-[var(--mpa-color-status-danger)]">This property has no units yet.</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="submit" disabled={units.length === 0}>
              Continue
            </Button>
          </div>
        </form>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <dl className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--mpa-color-text-secondary)]">Resident</dt>
              <dd className="font-medium text-[var(--mpa-color-text-primary)]">
                {firstName.trim()} {lastName.trim()}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--mpa-color-text-secondary)]">Email</dt>
              <dd className="font-medium text-[var(--mpa-color-text-primary)]">{email.trim()}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--mpa-color-text-secondary)]">Property</dt>
              <dd className="font-medium text-[var(--mpa-color-text-primary)]">
                {selectedProperty?.name ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--mpa-color-text-secondary)]">Unit</dt>
              <dd className="font-medium text-[var(--mpa-color-text-primary)]">
                {units.find((unit) => unit.id === effectiveUnitId)?.unit_label ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--mpa-color-text-secondary)]">Status after create</dt>
              <dd className="font-medium text-[var(--mpa-color-text-primary)]">Pending Lease</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--mpa-color-text-secondary)]">Portal</dt>
              <dd className="font-medium text-[var(--mpa-color-text-primary)]">Pending Activation</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => setStep(3)}>
              Back
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onCreate()}>
              {busy ? "Creating…" : "Create resident"}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
    </section>
  );
}
