"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@mpa/ui";

type SiteOption = {
  id: string;
  name: string;
  status: string;
  facility_locations?: Array<{ id: string; name: string }>;
};

type CategoryOption = { id: string; name: string; criticality_default: string };

type AssetCreateWizardProps = {
  onCancel?: () => void;
};

export function AssetCreateWizard({ onCancel }: AssetCreateWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [siteId, setSiteId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [criticality, setCriticality] = useState("medium");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [activateNow, setActivateNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [sitesResponse, categoriesResponse] = await Promise.all([
        fetch("/api/facility/sites"),
        fetch("/api/facility/categories")
      ]);
      if (sitesResponse.ok) {
        const body = (await sitesResponse.json()) as { sites?: SiteOption[] };
        const active = (body.sites ?? []).filter((site) => site.status === "active");
        setSites(active);
        if (active[0]) {
          setSiteId(active[0].id);
          setLocationId(active[0].facility_locations?.[0]?.id ?? "");
        }
      }
      if (categoriesResponse.ok) {
        const body = (await categoriesResponse.json()) as { categories?: CategoryOption[] };
        setCategories(body.categories ?? []);
        if (body.categories?.[0]) {
          setCategoryId(body.categories[0].id);
          setCriticality(body.categories[0].criticality_default);
        }
      }
    })();
  }, []);

  const selectedSite = sites.find((site) => site.id === siteId) ?? null;

  async function onCreate(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/facility/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          locationId: locationId || null,
          categoryId: categoryId || null,
          name: name.trim(),
          assetTag: assetTag.trim() || null,
          manufacturer: manufacturer.trim() || null,
          model: model.trim() || null,
          serialNumber: serialNumber.trim() || null,
          criticality,
          status: activateNow ? "active" : "intake"
        })
      });
      const payload = (await response.json()) as { asset?: { id: string }; error?: string };
      if (!response.ok || !payload.asset) {
        throw new Error(payload.error ?? "Unable to create asset.");
      }
      router.push(`/facility/assets/${payload.asset.id}?created=1`);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create asset.");
      setBusy(false);
    }
  }

  if (sites.length === 0) {
    return (
      <section className="max-w-xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
        <h2 className="font-display text-xl font-semibold">Activate a site first</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Assets require an active Facility Site. Create and activate a site, then return here.
        </p>
        <div className="flex gap-2">
          <Button type="button" onClick={() => router.push("/facility/sites?new=1")}>
            Go to Facility Sites
          </Button>
          {onCancel ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Step {step} of 3
        </p>
        <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Register an asset
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          One create path for the Facility Operations asset registry.
        </p>
      </header>

      {step === 1 ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!siteId || name.trim().length < 2) {
              setError("Site and asset name are required.");
              return;
            }
            setError(null);
            setStep(2);
          }}
        >
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Facility site</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
              value={siteId}
              onChange={(event) => {
                setSiteId(event.target.value);
                const site = sites.find((row) => row.id === event.target.value);
                setLocationId(site?.facility_locations?.[0]?.id ?? "");
              }}
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Location</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
            >
              <option value="">Unassigned location</option>
              {(selectedSite?.facility_locations ?? []).map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Asset name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
          </label>
          <div className="flex gap-2">
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
            setStep(3);
          }}
        >
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Category</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                const category = categories.find((row) => row.id === event.target.value);
                if (category) {
                  setCriticality(category.criticality_default);
                }
              }}
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Criticality</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
              value={criticality}
              onChange={(event) => setCriticality(event.target.value)}
            >
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Asset tag</span>
            <Input value={assetTag} onChange={(event) => setAssetTag(event.target.value)} />
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <form className="space-y-4" onSubmit={(event) => void onCreate(event)}>
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Manufacturer</span>
            <Input value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Model</span>
            <Input value={model} onChange={(event) => setModel(event.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--mpa-color-text-secondary)]">Serial number</span>
            <Input value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
            <input
              type="checkbox"
              checked={activateNow}
              onChange={(event) => setActivateNow(event.target.checked)}
            />
            Activate immediately (otherwise save as intake)
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)} disabled={busy}>
              Back
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : activateNow ? "Create & activate asset" : "Save intake"}
            </Button>
          </div>
        </form>
      ) : null}

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
    </section>
  );
}
