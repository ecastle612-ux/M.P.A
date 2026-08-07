"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Badge, Button, EmptyState, Input, Skeleton } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type SystemRow = {
  id: string;
  name: string;
  status: string;
  system_type: string;
  criticality: string;
  facility_sites?: { id: string; name: string } | null;
};

type SiteOption = { id: string; name: string; status: string };

export function SystemsDirectory() {
  const [systems, setSystems] = useState<SystemRow[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [systemType, setSystemType] = useState("hvac");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const response = await fetch("/api/facility/systems");
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to load systems");
    }
    setSystems((body.systems ?? []) as SystemRow[]);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [systemsResponse, sitesResponse] = await Promise.all([
          fetch("/api/facility/systems"),
          fetch("/api/facility/sites")
        ]);
        if (!systemsResponse.ok) {
          throw new Error((await systemsResponse.json()).error ?? "Failed to load systems");
        }
        const systemsBody = await systemsResponse.json();
        if (!cancelled) {
          setSystems((systemsBody.systems ?? []) as SystemRow[]);
        }
        if (sitesResponse.ok) {
          const sitesBody = (await sitesResponse.json()) as { sites?: SiteOption[] };
          const active = (sitesBody.sites ?? []).filter((site) => site.status === "active");
          if (!cancelled) {
            setSites(active);
            setSiteId(active[0]?.id ?? "");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load systems");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/facility/systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, name: name.trim(), systemType, status: "active" })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to create system");
      }
      setCreating(false);
      setName("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create system");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { label: "Building Systems" }
        ]}
      />
      <header className="flex max-w-3xl flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Building Systems</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Register HVAC, fire, electrical, and related systems. Mark down to raise Mission Control
            attention.
          </p>
        </div>
        {!creating ? (
          <Button type="button" onClick={() => setCreating(true)} disabled={sites.length === 0}>
            Register system
          </Button>
        ) : null}
      </header>

      {sites.length === 0 && !loading ? (
        <EmptyState
          title="Activate a site first"
          description="Building systems require an active Facility Site."
        />
      ) : null}

      {creating ? (
        <form
          onSubmit={(event) => void onCreate(event)}
          className="max-w-xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5"
        >
          <label className="block space-y-1 text-sm">
            <span>Site</span>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={siteId}
              onChange={(event) => setSiteId(event.target.value)}
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>Name</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Type</span>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={systemType}
              onChange={(event) => setSystemType(event.target.value)}
            >
              <option value="hvac">hvac</option>
              <option value="fire">fire</option>
              <option value="electrical">electrical</option>
              <option value="plumbing">plumbing</option>
              <option value="vertical_transport">vertical_transport</option>
              <option value="other">other</option>
            </select>
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Create system"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? <Skeleton className="h-24 w-full max-w-3xl" /> : null}
      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}

      {!loading && systems.length > 0 ? (
        <ul className="max-w-3xl space-y-2">
          {systems.map((system) => (
            <li key={system.id}>
              <Link
                href={`/facility/building-systems/${system.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3 text-sm"
              >
                <span>
                  <span className="font-medium">{system.name}</span>
                  <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                    {system.system_type} · {system.facility_sites?.name ?? "Site"}
                  </span>
                </span>
                <Badge
                  variant={
                    system.status === "down"
                      ? "danger"
                      : system.status === "degraded"
                        ? "warning"
                        : system.status === "active"
                          ? "success"
                          : "neutral"
                  }
                >
                  {system.status}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
