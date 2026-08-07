"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  PM_CADENCE_UNITS,
  PM_CRITICALITIES,
  WORK_ORDER_CATEGORIES,
  WORK_ORDER_PRIORITIES
} from "@mpa/shared";
import { Button, Input, Select, Textarea } from "@mpa/ui";

type SiteOption = { id: string; name: string; status: string };
type AssetOption = { id: string; name: string; site_id: string; criticality: string };
type SystemOption = { id: string; name: string; site_id: string; criticality: string };

type PmCreateWizardProps = {
  onCancel?: () => void;
};

export function PmCreateWizard({ onCancel }: PmCreateWizardProps) {
  const router = useRouter();
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [systems, setSystems] = useState<SystemOption[]>([]);
  const [siteId, setSiteId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [systemId, setSystemId] = useState("");
  const [name, setName] = useState("");
  const [titleTemplate, setTitleTemplate] = useState("");
  const [descriptionTemplate, setDescriptionTemplate] = useState("");
  const [category, setCategory] = useState<(typeof WORK_ORDER_CATEGORIES)[number]>("general");
  const [priority, setPriority] = useState<(typeof WORK_ORDER_PRIORITIES)[number]>("normal");
  const [cadenceUnit, setCadenceUnit] = useState<(typeof PM_CADENCE_UNITS)[number]>("month");
  const [cadenceInterval, setCadenceInterval] = useState(1);
  const [isOneShot, setIsOneShot] = useState(false);
  const [nextDueOn, setNextDueOn] = useState(new Date().toISOString().slice(0, 10));
  const [criticality, setCriticality] = useState<(typeof PM_CRITICALITIES)[number]>("medium");
  const [activateNow, setActivateNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [sitesResponse, assetsResponse, systemsResponse] = await Promise.all([
        fetch("/api/facility/sites"),
        fetch("/api/facility/assets"),
        fetch("/api/facility/systems")
      ]);
      if (sitesResponse.ok) {
        const body = (await sitesResponse.json()) as { sites?: SiteOption[] };
        const active = (body.sites ?? []).filter((site) => site.status === "active");
        setSites(active);
        if (active[0]) {
          setSiteId(active[0].id);
        }
      }
      if (assetsResponse.ok) {
        const body = (await assetsResponse.json()) as { assets?: AssetOption[] };
        setAssets(body.assets ?? []);
      }
      if (systemsResponse.ok) {
        const body = (await systemsResponse.json()) as { systems?: SystemOption[] };
        setSystems(body.systems ?? []);
      }
    })();
  }, []);

  const siteAssets = assets.filter((asset) => asset.site_id === siteId);
  const siteSystems = systems.filter((system) => system.site_id === siteId);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/facility/preventive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          assetId: assetId || null,
          systemId: systemId || null,
          name: name.trim(),
          titleTemplate: titleTemplate.trim(),
          descriptionTemplate: descriptionTemplate.trim(),
          category,
          priority,
          cadenceUnit,
          cadenceInterval,
          isOneShot,
          nextDueOn,
          criticality,
          activateNow
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to create PM program");
      }
      router.push(`/facility/preventive-maintenance?scheduleId=${body.schedule.id as string}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create PM program");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void onCreate(event)}
      className="max-w-2xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4"
    >
      <div>
        <h2 className="text-base font-semibold">Create preventive maintenance program</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Define schedule, work template, and targets. Due generation opens shared Maintenance work
          orders.
        </p>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Program name</span>
        <Input
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Quarterly AHU filter change"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Facility site</span>
        <Select
          required
          value={siteId}
          onChange={(event) => {
            setSiteId(event.target.value);
            setAssetId("");
            setSystemId("");
          }}
        >
          <option value="" disabled>
            Select site
          </option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </Select>
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>Asset</span>
          <Select value={assetId} onChange={(event) => setAssetId(event.target.value)}>
            <option value="">None</option>
            {siteAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1 text-sm">
          <span>Building system</span>
          <Select value={systemId} onChange={(event) => setSystemId(event.target.value)}>
            <option value="">None</option>
            {siteSystems.map((system) => (
              <option key={system.id} value={system.id}>
                {system.name}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
        Assign an asset and/or building system.
      </p>

      <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] p-3">
        <h3 className="text-sm font-semibold">Work template</h3>
        <label className="block space-y-1 text-sm">
          <span>Generated work title</span>
          <Input
            required
            minLength={3}
            value={titleTemplate}
            onChange={(event) => setTitleTemplate(event.target.value)}
            placeholder="Replace AHU-1 filters"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Generated work description</span>
          <Textarea
            value={descriptionTemplate}
            onChange={(event) => setDescriptionTemplate(event.target.value)}
            rows={3}
            placeholder="Checklist and notes for technicians"
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>Category</span>
            <Select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as (typeof WORK_ORDER_CATEGORIES)[number])
              }
            >
              {WORK_ORDER_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>Priority</span>
            <Select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as (typeof WORK_ORDER_PRIORITIES)[number])
              }
            >
              {WORK_ORDER_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="block space-y-1 text-sm">
          <span>Every</span>
          <Input
            type="number"
            min={1}
            max={365}
            value={cadenceInterval}
            onChange={(event) => setCadenceInterval(Number(event.target.value) || 1)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Cadence</span>
          <Select
            value={cadenceUnit}
            onChange={(event) =>
              setCadenceUnit(event.target.value as (typeof PM_CADENCE_UNITS)[number])
            }
          >
            {PM_CADENCE_UNITS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1 text-sm">
          <span>Next due</span>
          <Input
            type="date"
            required
            value={nextDueOn}
            onChange={(event) => setNextDueOn(event.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>Criticality</span>
          <Select
            value={criticality}
            onChange={(event) =>
              setCriticality(event.target.value as (typeof PM_CRITICALITIES)[number])
            }
          >
            {PM_CRITICALITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex flex-col justify-end gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isOneShot}
              onChange={(event) => setIsOneShot(event.target.checked)}
            />
            One-shot (retire after acknowledge)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={activateNow}
              onChange={(event) => setActivateNow(event.target.checked)}
            />
            Activate immediately
          </label>
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={busy || !siteId || (!assetId && !systemId) || name.trim().length < 2}
        >
          {busy ? "Creating…" : "Create program"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
