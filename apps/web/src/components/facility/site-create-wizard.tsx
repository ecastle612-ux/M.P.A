"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@mpa/ui";

type SiteCreateWizardProps = {
  onCancel?: () => void;
  propertyOptions?: Array<{ id: string; name: string }>;
};

export function SiteCreateWizard({ onCancel, propertyOptions = [] }: SiteCreateWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [rootLocationName, setRootLocationName] = useState("Main building");
  const [propertyId, setPropertyId] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/facility/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          timezone: timezone.trim() || "America/New_York",
          rootLocationName: rootLocationName.trim() || "Main building",
          rootLocationType: "building",
          addressLine1: addressLine1.trim() || null,
          city: city.trim() || null,
          propertyId: propertyId || null,
          activate: true
        })
      });
      const payload = (await response.json()) as {
        site?: { id: string };
        error?: string;
      };
      if (!response.ok || !payload.site) {
        throw new Error(payload.error ?? "Unable to create facility site.");
      }
      router.push(`/facility/sites/${payload.site.id}?created=1`);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create facility site.");
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="facility-site-create-title"
      className="max-w-xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
    >
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Step {step} of 3
        </p>
        <h2
          id="facility-site-create-title"
          className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Add a facility site
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Phase E.1 site identity — name, timezone, root location. Activates when you finish.
        </p>
      </header>

      {step === 1 ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim().length < 2) {
              setError("Enter a site name.");
              return;
            }
            setError(null);
            setStep(2);
          }}
        >
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="site-name">
              Site name
            </label>
            <Input
              id="site-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Central Campus"
              required
              autoFocus
              minLength={2}
              maxLength={120}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="site-timezone">
              Timezone
            </label>
            <Input
              id="site-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="America/New_York"
              required
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
            if (rootLocationName.trim().length < 1) {
              setError("Enter a root location name.");
              return;
            }
            setError(null);
            setStep(3);
          }}
        >
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="root-location">
              Root location (building / campus)
            </label>
            <Input
              id="root-location"
              value={rootLocationName}
              onChange={(event) => setRootLocationName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="address">
              Address (optional)
            </label>
            <Input
              id="address"
              value={addressLine1}
              onChange={(event) => setAddressLine1(event.target.value)}
              placeholder="100 Operations Way"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="city">
              City (optional)
            </label>
            <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} />
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
        <form className="space-y-4" onSubmit={(event) => void onCreate(event)}>
          {propertyOptions.length > 0 ? (
            <div className="space-y-1">
              <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="property-link">
                Link Property Manager property (optional)
              </label>
              <select
                id="property-link"
                className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
                value={propertyId}
                onChange={(event) => setPropertyId(event.target.value)}
              >
                <option value="">No property link</option>
                {propertyOptions.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              No Property Manager properties available to link (or PM not entitled).
            </p>
          )}
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Creating <strong>{name}</strong> with timezone <strong>{timezone}</strong> and root
            location <strong>{rootLocationName}</strong>. The site will activate immediately.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)} disabled={busy}>
              Back
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create & activate site"}
            </Button>
          </div>
        </form>
      ) : null}

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
    </section>
  );
}
