"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@mpa/ui";
import {
  AdditionalUnitCapacityGate,
  type CapacityGatePayload
} from "../commercial/additional-unit-capacity-gate";

type PropertyCreateWizardProps = {
  onCancel?: () => void;
};

export function PropertyCreateWizard({ onCancel }: PropertyCreateWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [unitCount, setUnitCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [gate, setGate] = useState<CapacityGatePayload | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [authorizeBusy, setAuthorizeBusy] = useState(false);
  const [authorizeError, setAuthorizeError] = useState<string | null>(null);

  async function onCreate(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/pm/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), unitCount })
      });
      const payload = (await response.json()) as {
        property?: { id: string };
        error?: string;
        intentId?: string;
        gate?: CapacityGatePayload;
      };
      if (response.status === 409 && payload.error === "additional_unit_capacity_required") {
        setGate(payload.gate ?? null);
        setIntentId(payload.intentId ?? null);
        setGateOpen(true);
        setBusy(false);
        return;
      }
      if (!response.ok || !payload.property) {
        throw new Error(payload.error ?? "Unable to create property.");
      }
      router.push(`/pm/properties/${payload.property.id}?created=1`);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create property.");
      setBusy(false);
    }
  }

  async function onAuthorizeCapacity() {
    if (!intentId) {
      setAuthorizeError("Authorization session expired. Try creating again.");
      return;
    }
    setAuthorizeBusy(true);
    setAuthorizeError(null);
    const res = await fetch("/api/commerce/capacity/authorize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intentId })
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setAuthorizeBusy(false);
    if (!res.ok) {
      setAuthorizeError(payload.error ?? "Authorization failed.");
      return;
    }
    setGateOpen(false);
    setGate(null);
    setIntentId(null);
    // Retry the blocked create — capacity is now authorized.
    await onCreate();
  }

  return (
    <>
      <section
        aria-labelledby="property-create-title"
        className="max-w-xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5"
      >
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Step {step} of 3
          </p>
          <h2
            id="property-create-title"
            className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Add your first property
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Launch-critical details only. Your property activates as soon as you finish.
          </p>
        </header>

        {step === 1 ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim().length < 2) {
                setError("Enter a property name.");
                return;
              }
              setError(null);
              setStep(2);
            }}
          >
            <div className="space-y-1">
              <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="property-name">
                Property name
              </label>
              <Input
                id="property-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Oak Street Apartments"
                required
                autoFocus
                minLength={2}
                maxLength={120}
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
              setError(null);
              setStep(3);
            }}
          >
            <div className="space-y-1">
              <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="unit-count">
                How many units?
              </label>
              <Input
                id="unit-count"
                type="number"
                min={1}
                max={50}
                value={unitCount}
                onChange={(event) => setUnitCount(Number(event.target.value) || 1)}
                required
              />
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                We create units labeled 1…{unitCount}. You can refine later.
              </p>
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
          <div className="space-y-4">
            <dl className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--mpa-color-text-secondary)]">Name</dt>
                <dd className="font-medium text-[var(--mpa-color-text-primary)]">{name.trim()}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--mpa-color-text-secondary)]">Units</dt>
                <dd className="font-medium text-[var(--mpa-color-text-primary)]">{unitCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--mpa-color-text-secondary)]">Status after create</dt>
                <dd className="font-medium text-[var(--mpa-color-text-primary)]">Active</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="button" disabled={busy} onClick={() => void onCreate()}>
                {busy ? "Creating…" : "Create and activate property"}
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      </section>

      <AdditionalUnitCapacityGate
        open={gateOpen}
        gate={gate}
        busy={authorizeBusy}
        error={authorizeError}
        onClose={() => {
          setGateOpen(false);
          setAuthorizeError(null);
        }}
        onAuthorize={() => void onAuthorizeCapacity()}
      />
    </>
  );
}
