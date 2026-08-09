"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@mpa/ui";

type PendingResident = {
  id: string;
  display_name: string;
  email: string;
  status: string;
  property_properties?: { id: string; name: string } | null;
  property_units?: { id: string; unit_label: string } | null;
};

type LeaseCreateWizardProps = {
  onCancel?: () => void;
};

export function LeaseCreateWizard({ onCancel }: LeaseCreateWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [residents, setResidents] = useState<PendingResident[]>([]);
  const [residentId, setResidentId] = useState("");
  const [rentAmount, setRentAmount] = useState("1500");
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [requireManagerSignature, setRequireManagerSignature] = useState(true);
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/pm/leasing");
        const body = (await response.json()) as {
          pendingResidents?: PendingResident[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? "Unable to load residents.");
        }
        if (!cancelled) {
          const list = body.pendingResidents ?? [];
          setResidents(list);
          if (list[0]) {
            setResidentId(list[0].id);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load residents.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => residents.find((resident) => resident.id === residentId) ?? null,
    [residents, residentId]
  );

  async function onCreate(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/pm/leasing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          residentId,
          rentAmount: Number(rentAmount),
          dayOfMonth,
          requireManagerSignature,
          managerName: requireManagerSignature ? managerName.trim() : undefined,
          managerEmail: requireManagerSignature ? managerEmail.trim() : undefined
        })
      });
      const payload = (await response.json()) as { lease?: { id: string }; error?: string };
      if (!response.ok || !payload.lease) {
        throw new Error(payload.error ?? "Unable to create lease.");
      }
      router.push(`/pm/leasing/${payload.lease.id}?created=1`);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create lease.");
      setBusy(false);
    }
  }

  if (!loading && residents.length === 0) {
    return (
      <section className="max-w-xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5">
        <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Create your first lease
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Add a resident with Approved or Lease Pending status before creating a lease — or open an
          application from this Leasing workspace first.
        </p>
        <Button type="button" onClick={() => router.push("/pm/residents?new=1")}>
          Add resident
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
      aria-labelledby="lease-create-title"
      className="max-w-xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5"
    >
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Step {step} of 3
        </p>
        <h2
          id="lease-create-title"
          className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Create your first lease
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          One leasing path. Select a Pending Lease resident, set rent, then review and send for
          signature.
        </p>
      </header>

      {step === 1 ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!residentId) {
              setError("Select a resident.");
              return;
            }
            setError(null);
            setStep(2);
          }}
        >
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="resident-id">
              Select resident (Approved / Lease Pending)
            </label>
            <Select
              id="resident-id"
              value={residentId}
              onChange={(event) => setResidentId(event.target.value)}
              required
              disabled={loading}
            >
              {residents.map((resident) => (
                <option key={resident.id} value={resident.id}>
                  {resident.display_name} · {resident.property_properties?.name ?? "Property"} · Unit{" "}
                  {resident.property_units?.unit_label ?? "—"}
                </option>
              ))}
            </Select>
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
            if (!Number(rentAmount) || Number(rentAmount) <= 0) {
              setError("Enter a valid rent amount.");
              return;
            }
            if (requireManagerSignature && (!managerName.trim() || !managerEmail.trim())) {
              setError("Enter manager name and email for countersignature.");
              return;
            }
            setError(null);
            setStep(3);
          }}
        >
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="rent-amount">
              Monthly rent
            </label>
            <Input
              id="rent-amount"
              type="number"
              min={1}
              step="0.01"
              value={rentAmount}
              onChange={(event) => setRentAmount(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="day-of-month">
              Rent due day
            </label>
            <Input
              id="day-of-month"
              type="number"
              min={1}
              max={28}
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(Number(event.target.value) || 1)}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requireManagerSignature}
              onChange={(event) => setRequireManagerSignature(event.target.checked)}
            />
            Require manager signature
          </label>
          {requireManagerSignature ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="manager-name">
                  Manager name
                </label>
                <Input
                  id="manager-name"
                  value={managerName}
                  onChange={(event) => setManagerName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label
                  className="text-sm text-[var(--mpa-color-text-secondary)]"
                  htmlFor="manager-email"
                >
                  Manager email
                </label>
                <Input
                  id="manager-email"
                  type="email"
                  value={managerEmail}
                  onChange={(event) => setManagerEmail(event.target.value)}
                  required
                />
              </div>
            </div>
          ) : null}
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
              <dt className="text-[var(--mpa-color-text-secondary)]">Resident</dt>
              <dd className="font-medium">{selected?.display_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--mpa-color-text-secondary)]">Property / unit</dt>
              <dd className="font-medium">
                {selected?.property_properties?.name} · Unit{" "}
                {selected?.property_units?.unit_label}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--mpa-color-text-secondary)]">Monthly rent</dt>
              <dd className="font-medium">${Number(rentAmount).toFixed(2)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--mpa-color-text-secondary)]">Due day</dt>
              <dd className="font-medium">{dayOfMonth}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--mpa-color-text-secondary)]">Manager sign</dt>
              <dd className="font-medium">{requireManagerSignature ? "Required" : "Not required"}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onCreate()}>
              {busy ? "Creating…" : "Create lease draft"}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
    </section>
  );
}
