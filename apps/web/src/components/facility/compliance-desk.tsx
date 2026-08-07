"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Badge, Button, EmptyState, Input, Select, Skeleton, Textarea } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type SiteOption = { id: string; name: string };

type Obligation = {
  id: string;
  title: string;
  authority: string;
  requirement: string | null;
  due_on: string;
  status: string;
  evidence_document_ids: string[];
  waiver_reason: string | null;
  satisfied_at: string | null;
  waived_at: string | null;
  facility_sites?: { name: string } | null;
};

type Summary = {
  total: number;
  openCount: number;
  overdueCount: number;
  dueTodayCount: number;
  upcomingCount: number;
};

function statusBadge(status: string) {
  if (status === "overdue") {
    return <Badge variant="danger">{status}</Badge>;
  }
  if (status === "due") {
    return <Badge variant="warning">{status}</Badge>;
  }
  if (status === "satisfied") {
    return <Badge variant="success">{status}</Badge>;
  }
  if (status === "waived") {
    return <Badge variant="neutral">{status}</Badge>;
  }
  return <Badge variant="neutral">{status}</Badge>;
}

export function ComplianceDesk() {
  const searchParams = useSearchParams();
  const preferredObligationId = searchParams.get("obligationId") ?? "";

  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    openCount: 0,
    overdueCount: 0,
    dueTodayCount: 0,
    upcomingCount: 0
  });
  const [assistantRecommendation, setAssistantRecommendation] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<"open" | "overdue" | "all">("open");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [siteId, setSiteId] = useState("");
  const [title, setTitle] = useState("");
  const [authority, setAuthority] = useState("internal");
  const [requirement, setRequirement] = useState("");
  const [dueOn, setDueOn] = useState(new Date().toISOString().slice(0, 10));

  const [evidenceIds, setEvidenceIds] = useState("");
  const [waiverReason, setWaiverReason] = useState("");

  const selected = useMemo(
    () => obligations.find((row) => row.id === selectedId) ?? null,
    [obligations, selectedId]
  );

  const filtered = useMemo(() => {
    if (filter === "all") {
      return obligations;
    }
    if (filter === "overdue") {
      return obligations.filter((row) => row.status === "overdue");
    }
    return obligations.filter(
      (row) => row.status !== "satisfied" && row.status !== "waived"
    );
  }, [filter, obligations]);

  const refresh = useCallback(
    async (preferred?: string) => {
      const response = await fetch("/api/facility/compliance");
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to load compliance obligations");
      }
      const rows = (body.obligations ?? []) as Obligation[];
      setObligations(rows);
      setSummary(body.summary ?? {});
      setAssistantRecommendation(body.assistantRecommendation ?? "");
      setSites(body.sites ?? []);
      if (body.sites?.[0] && !siteId) {
        setSiteId((body.sites as SiteOption[])[0]!.id);
      }
      const nextId = preferred || preferredObligationId || selectedId || rows[0]?.id || "";
      setSelectedId(nextId);
    },
    [preferredObligationId, selectedId, siteId]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh(preferredObligationId || undefined);
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

  function parseEvidenceIds(raw: string): string[] {
    return raw
      .split(/[,;\s]+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  async function createObligation(event: FormEvent) {
    event.preventDefault();
    await runAction(async () => {
      const response = await fetch("/api/facility/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          title: title.trim(),
          authority: authority.trim(),
          requirement: requirement.trim() || null,
          dueOn
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to create obligation");
      }
      setCreating(false);
      setTitle("");
      setRequirement("");
      setSelectedId(body.obligation.id as string);
      setNotice("Obligation created.");
    });
  }

  async function satisfyObligation() {
    if (!selectedId) {
      return;
    }
    const ids = parseEvidenceIds(evidenceIds);
    if (ids.length === 0) {
      setError("Enter at least one evidence document UUID");
      return;
    }
    await runAction(async () => {
      const response = await fetch(`/api/facility/compliance/${selectedId}/satisfy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidenceDocumentIds: ids })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to satisfy obligation");
      }
      setEvidenceIds("");
      setNotice("Obligation satisfied with evidence.");
    });
  }

  async function waiveObligation() {
    if (!selectedId || waiverReason.trim().length < 3) {
      return;
    }
    await runAction(async () => {
      const response = await fetch(`/api/facility/compliance/${selectedId}/waive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waiverReason: waiverReason.trim() })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to waive obligation");
      }
      setWaiverReason("");
      setNotice("Obligation waived.");
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
          { label: "Compliance" }
        ]}
      />

      <header className="flex max-w-5xl flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold">Compliance</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Track regulatory obligations, attach evidence documents, and waive with reason when
            appropriate.
          </p>
        </div>
        {!creating ? (
          <Button type="button" onClick={() => setCreating(true)}>
            Create obligation
          </Button>
        ) : null}
      </header>

      <section className="flex max-w-3xl flex-wrap gap-2">
        <Badge variant={summary.overdueCount > 0 ? "danger" : "neutral"}>
          {summary.overdueCount} overdue
        </Badge>
        <Badge variant={summary.dueTodayCount > 0 ? "warning" : "neutral"}>
          {summary.dueTodayCount} due today
        </Badge>
        <Badge variant="neutral">{summary.openCount} open</Badge>
      </section>

      <section className="max-w-3xl rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant recommendation
        </p>
        <p className="mt-1">{assistantRecommendation}</p>
      </section>

      {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-status-success)]">{notice}</p> : null}

      {creating ? (
        <form
          onSubmit={(event) => void createObligation(event)}
          className="max-w-xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4"
        >
          <h2 className="text-base font-semibold">Create compliance obligation</h2>
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
          <label className="block space-y-1 text-sm">
            <span>Title</span>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Authority</span>
            <Input
              required
              value={authority}
              onChange={(e) => setAuthority(e.target.value)}
              placeholder="EPA, local fire marshal, internal"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Requirement</span>
            <Textarea
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              rows={2}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>Due date</span>
            <Input type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} required />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || sites.length === 0}>
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["open", "Open"],
                ["overdue", "Overdue"],
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
            <EmptyState
              title="No obligations"
              description="Create a compliance obligation for this site."
            />
          ) : (
            <ul className="divide-y divide-[var(--mpa-color-border-default)]">
              {filtered.map((obligation) => (
                <li key={obligation.id}>
                  <button
                    type="button"
                    className={`w-full px-1 py-3 text-left ${
                      selectedId === obligation.id ? "bg-[var(--mpa-color-bg-subtle)]" : ""
                    }`}
                    onClick={() => setSelectedId(obligation.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{obligation.title}</span>
                      {statusBadge(obligation.status)}
                    </div>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {obligation.facility_sites?.name} · {obligation.authority} · due{" "}
                      {obligation.due_on}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
          {!selected ? (
            <EmptyState
              title="Select an obligation"
              description="Satisfy with evidence or waive with reason."
            />
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{selected.title}</h2>
                <div className="flex flex-wrap gap-2">{statusBadge(selected.status)}</div>
                <dl className="grid gap-2 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Authority</dt>
                    <dd>{selected.authority}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Due</dt>
                    <dd>{selected.due_on}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--mpa-color-text-secondary)]">Site</dt>
                    <dd>{selected.facility_sites?.name ?? "—"}</dd>
                  </div>
                </dl>
                {selected.requirement ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    {selected.requirement}
                  </p>
                ) : null}
                {selected.evidence_document_ids.length > 0 ? (
                  <div className="text-sm">
                    <p className="font-semibold">Evidence documents</p>
                    <ul>
                      {selected.evidence_document_ids.map((docId) => (
                        <li key={docId} className="font-mono text-xs">{docId}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {selected.waiver_reason ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    Waiver: {selected.waiver_reason}
                  </p>
                ) : null}
              </div>

              {selected.status !== "satisfied" && selected.status !== "waived" ? (
                <>
                  <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                    <h3 className="text-sm font-semibold">Satisfy with evidence</h3>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      Enter document UUID(s) from shared Documents. Documents attach to entity{" "}
                      <span className="font-mono">facility_compliance_obligation</span>.
                    </p>
                    <Textarea
                      value={evidenceIds}
                      onChange={(e) => setEvidenceIds(e.target.value)}
                      rows={2}
                      placeholder="uuid-1, uuid-2"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy || parseEvidenceIds(evidenceIds).length === 0}
                      onClick={() => void satisfyObligation()}
                    >
                      Mark satisfied
                    </Button>
                  </div>

                  <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                    <h3 className="text-sm font-semibold">Waive obligation</h3>
                    <Textarea
                      value={waiverReason}
                      onChange={(e) => setWaiverReason(e.target.value)}
                      rows={2}
                      placeholder="Waiver reason (required)"
                    />
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={busy || waiverReason.trim().length < 3}
                      onClick={() => void waiveObligation()}
                    >
                      Waive
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
