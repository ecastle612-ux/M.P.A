"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { WORK_ORDER_CATEGORIES, WORK_ORDER_PRIORITIES } from "@mpa/shared";
import { Button, Input, Select, Textarea } from "@mpa/ui";

type SiteOption = { id: string; name: string; status: string };
type AssetOption = { id: string; name: string; site_id: string; criticality: string };
type SystemOption = { id: string; name: string; site_id: string; criticality: string };

type FacilityWorkCreateWizardProps = {
  onCancel?: () => void;
};

export function FacilityWorkCreateWizard({ onCancel }: FacilityWorkCreateWizardProps) {
  const router = useRouter();
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [systems, setSystems] = useState<SystemOption[]>([]);
  const [siteId, setSiteId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [systemId, setSystemId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof WORK_ORDER_CATEGORIES)[number]>("general");
  const [priority, setPriority] = useState<(typeof WORK_ORDER_PRIORITIES)[number] | "">("");
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
      const response = await fetch("/api/facility/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          assetId: assetId || null,
          systemId: systemId || null,
          title: title.trim(),
          description: description.trim(),
          category,
          priority: priority || undefined
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to create facility work");
      }
      router.push(`/facility/operations?workOrderId=${body.workOrder.id as string}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create facility work");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void onCreate(event)}
      className="max-w-2xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
    >
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          Create facility corrective work
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Opens a shared work order with facility context. Maintenance remains the execution engine.
        </p>
      </div>

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
          <span>Asset (optional)</span>
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
          <span>Building system (optional)</span>
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

      <label className="block space-y-1 text-sm">
        <span>Title</span>
        <Input
          required
          minLength={3}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Restore AHU-1 airflow"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Description</span>
        <Textarea
          required
          minLength={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Operational context for technicians and vendors"
          rows={4}
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
              setPriority(
                event.target.value
                  ? (event.target.value as (typeof WORK_ORDER_PRIORITIES)[number])
                  : ""
              )
            }
          >
            <option value="">Default from asset/system criticality</option>
            {WORK_ORDER_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || !siteId || title.trim().length < 3}>
          {busy ? "Creating…" : "Open facility work"}
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
