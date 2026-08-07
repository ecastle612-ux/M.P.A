"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  SAFETY_INCIDENT_TYPES,
  SAFETY_SEVERITIES,
  WORK_ORDER_CATEGORIES,
  type SafetySeverity
} from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Select, Skeleton, Textarea } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type SiteOption = { id: string; name: string };

type Incident = {
  id: string;
  incident_type: string;
  severity: SafetySeverity;
  status: string;
  title: string;
  description: string;
  closed_summary: string | null;
  closed_at: string | null;
  created_at: string;
  workOrderIds?: string[];
  facility_sites?: { name: string } | null;
  facility_assets?: { name: string } | null;
  facility_systems?: { name: string } | null;
};

type Summary = {
  total: number;
  openCount: number;
  highSeverityCount: number;
  actionsOpenCount: number;
};

function severityBadge(severity: SafetySeverity) {
  if (severity === "critical" || severity === "high") {
    return <Badge variant="danger">{severity}</Badge>;
  }
  if (severity === "medium") {
    return <Badge variant="warning">{severity}</Badge>;
  }
  return <Badge variant="neutral">{severity}</Badge>;
}

export function SafetyDesk() {
  const searchParams = useSearchParams();
  const preferredIncidentId = searchParams.get("incidentId") ?? "";

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    openCount: 0,
    highSeverityCount: 0,
    actionsOpenCount: 0
  });
  const [assistantRecommendation, setAssistantRecommendation] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<"open" | "all" | "high">("open");
  const [reporting, setReporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [siteId, setSiteId] = useState("");
  const [incidentType, setIncidentType] =
    useState<(typeof SAFETY_INCIDENT_TYPES)[number]>("incident");
  const [severity, setSeverity] = useState<SafetySeverity>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [triageSeverity, setTriageSeverity] = useState<SafetySeverity>("medium");
  const [triageNotes, setTriageNotes] = useState("");
  const [woTitle, setWoTitle] = useState("");
  const [woDescription, setWoDescription] = useState("");
  const [woCategory, setWoCategory] =
    useState<(typeof WORK_ORDER_CATEGORIES)[number]>("general");
  const [closedSummary, setClosedSummary] = useState("");
  const [deferOpenWorkOrders, setDeferOpenWorkOrders] = useState(false);

  const selected = useMemo(
    () => incidents.find((row) => row.id === selectedId) ?? null,
    [incidents, selectedId]
  );

  const filtered = useMemo(() => {
    if (filter === "all") {
      return incidents;
    }
    if (filter === "high") {
      return incidents.filter(
        (row) => row.severity === "high" || row.severity === "critical"
      );
    }
    return incidents.filter((row) => row.status !== "closed");
  }, [filter, incidents]);

  const refresh = useCallback(
    async (preferred?: string) => {
      const response = await fetch("/api/facility/safety");
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to load safety incidents");
      }
      const rows = (body.incidents ?? []) as Incident[];
      setIncidents(rows);
      setSummary(body.summary ?? {});
      setAssistantRecommendation(body.assistantRecommendation ?? "");
      setSites(body.sites ?? []);
      if (body.sites?.[0] && !siteId) {
        setSiteId((body.sites as SiteOption[])[0]!.id);
      }
      const nextId = preferred || preferredIncidentId || selectedId || rows[0]?.id || "";
      setSelectedId(nextId);
      const incident = rows.find((row) => row.id === nextId);
      if (incident) {
        setTriageSeverity(incident.severity);
        setWoTitle(`Corrective: ${incident.title}`);
        setWoDescription(incident.description);
      }
    },
    [preferredIncidentId, selectedId, siteId]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh(preferredIncidentId || undefined);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      await refresh(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function reportIncident(event: FormEvent) {
    event.preventDefault();
    await runAction(async () => {
      const response = await fetch("/api/facility/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          incidentType,
          severity,
          title: title.trim(),
          description: description.trim()
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to report incident");
      }
      setReporting(false);
      setTitle("");
      setDescription("");
      setSelectedId(body.incident.id as string);
      setNotice("Incident reported.");
    });
  }

  async function triageIncident() {
    if (!selectedId) {
      return;
    }
    await runAction(async () => {
      const response = await fetch(`/api/facility/safety/${selectedId}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          severity: triageSeverity,
          notes: triageNotes.trim() || null
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to triage");
      }
      setTriageNotes("");
      setNotice("Incident triaged.");
    });
  }

  async function spawnWorkOrder() {
    if (!selectedId) {
      return;
    }
    await runAction(async () => {
      const response = await fetch(`/api/facility/safety/${selectedId}/spawn-work`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: woTitle.trim(),
          description: woDescription.trim(),
          category: woCategory
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to spawn work order");
      }
      setNotice(`Work order spawned: ${body.workOrder?.title ?? "created"}.`);
    });
  }

  async function closeIncident() {
    if (!selectedId) {
      return;
    }
    await runAction(async () => {
      const response = await fetch(`/api/facility/safety/${selectedId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closedSummary: closedSummary.trim(),
          deferOpenWorkOrders
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to close incident");
      }
      setClosedSummary("");
      setNotice("Incident closed.");
    });
  }

  if (loading) {
    return (
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full max-w-3xl" />
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { label: "Safety" }
        ]}
      />

      <header className="flex max-w-5xl flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold">Safety</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Report incidents, triage severity, spawn corrective work, and close with summary.
          </p>
        </div>
        {!reporting ? (
          <Button type="button" onClick={() => setReporting(true)}>
            Report incident
          </Button>
        ) : null}
      </header>

      <section className="flex max-w-3xl flex-wrap gap-2">
        <Badge variant={summary.highSeverityCount > 0 ? "danger" : "neutral"}>
          {summary.highSeverityCount} high severity
        </Badge>
        <Badge variant={summary.actionsOpenCount > 0 ? "warning" : "neutral"}>
          {summary.actionsOpenCount} actions open
        </Badge>
        <Badge variant="neutral">{summary.openCount} open</Badge>
      </section>

      <section className="max-w-3xl rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant recommendation
        </p>
        <p className="mt-1">{assistantRecommendation}</p>
      </section>

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-800">{notice}</p> : null}

      {reporting ? (
        <form
          onSubmit={(event) => void reportIncident(event)}
          className="max-w-xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        >
          <h2 className="text-base font-semibold">Report safety incident</h2>
          <label className="block space-y-1 text-sm">
            <span>Site</span>
            <Select value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </Select>
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Type</span>
              <Select
                value={incidentType}
                onChange={(e) =>
                  setIncidentType(e.target.value as (typeof SAFETY_INCIDENT_TYPES)[number])
                }
              >
                {SAFETY_INCIDENT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Severity</span>
              <Select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SafetySeverity)}
              >
                {SAFETY_SEVERITIES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span>Title</span>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Description</span>
            <Textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || sites.length === 0}>
              Submit report
            </Button>
            <Button type="button" variant="secondary" onClick={() => setReporting(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["open", "Open"],
                ["high", "High severity"],
                ["all", "All"]
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={filter === value ? "primary" : "secondary"}
                onClick={() => setFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No incidents" description="Report a safety incident or near miss." />
          ) : (
            <ul className="divide-y divide-[var(--mpa-color-border-default)]">
              {filtered.map((incident) => (
                <li key={incident.id}>
                  <button
                    type="button"
                    className={`w-full px-1 py-3 text-left ${
                      selectedId === incident.id ? "bg-[var(--mpa-color-bg-subtle)]" : ""
                    }`}
                    onClick={() => {
                      setSelectedId(incident.id);
                      setTriageSeverity(incident.severity);
                      setWoTitle(`Corrective: ${incident.title}`);
                      setWoDescription(incident.description);
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{incident.title}</span>
                      {severityBadge(incident.severity)}
                      <Badge variant="neutral">{incident.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {incident.facility_sites?.name} · {incident.incident_type} ·{" "}
                      {new Date(incident.created_at).toLocaleDateString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          {!selected ? (
            <EmptyState
              title="Select an incident"
              description="Triage, spawn corrective work, or close."
            />
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{selected.title}</h2>
                <div className="flex flex-wrap gap-2">
                  {severityBadge(selected.severity)}
                  <Badge variant="neutral">{selected.status}</Badge>
                  <Badge variant="neutral">{selected.incident_type}</Badge>
                </div>
                <p className="text-sm">{selected.description}</p>
                <dl className="grid gap-2 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Site</dt>
                    <dd>{selected.facility_sites?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Asset</dt>
                    <dd>{selected.facility_assets?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">System</dt>
                    <dd>{selected.facility_systems?.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Reported</dt>
                    <dd>{new Date(selected.created_at).toLocaleString()}</dd>
                  </div>
                </dl>
                {(selected.workOrderIds ?? []).length > 0 ? (
                  <ul className="text-sm">
                    {selected.workOrderIds!.map((woId) => (
                      <li key={woId}>
                        <Link
                          href={`/facility/operations?workOrderId=${woId}`}
                          className="underline"
                        >
                          Linked work order
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {selected.closed_summary ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    Closed: {selected.closed_summary}
                  </p>
                ) : null}
              </div>

              {selected.status !== "closed" ? (
                <>
                  <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                    <h3 className="text-sm font-semibold">Triage</h3>
                    <Select
                      value={triageSeverity}
                      onChange={(e) => setTriageSeverity(e.target.value as SafetySeverity)}
                    >
                      {SAFETY_SEVERITIES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                    <Textarea
                      value={triageNotes}
                      onChange={(e) => setTriageNotes(e.target.value)}
                      rows={2}
                      placeholder="Triage notes"
                    />
                    <Button type="button" size="sm" disabled={busy} onClick={() => void triageIncident()}>
                      Triage incident
                    </Button>
                  </div>

                  <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                    <h3 className="text-sm font-semibold">Spawn corrective work order</h3>
                    <Input
                      value={woTitle}
                      onChange={(e) => setWoTitle(e.target.value)}
                      placeholder="Work order title"
                    />
                    <Textarea
                      value={woDescription}
                      onChange={(e) => setWoDescription(e.target.value)}
                      rows={2}
                      placeholder="Description"
                    />
                    <Select
                      value={woCategory}
                      onChange={(e) =>
                        setWoCategory(e.target.value as (typeof WORK_ORDER_CATEGORIES)[number])
                      }
                    >
                      {WORK_ORDER_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy || !woTitle.trim() || !woDescription.trim()}
                      onClick={() => void spawnWorkOrder()}
                    >
                      Spawn work order
                    </Button>
                  </div>

                  <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                    <h3 className="text-sm font-semibold">Close incident</h3>
                    <Textarea
                      value={closedSummary}
                      onChange={(e) => setClosedSummary(e.target.value)}
                      rows={3}
                      placeholder="Closed summary (required)"
                    />
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={deferOpenWorkOrders}
                        onChange={(e) => setDeferOpenWorkOrders(e.target.checked)}
                      />
                      Defer open linked work orders
                    </label>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={busy || closedSummary.trim().length < 3}
                      onClick={() => void closeIncident()}
                    >
                      Close incident
                    </Button>
                  </div>
                </>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
