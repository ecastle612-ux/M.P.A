"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  INSPECTION_CADENCE_UNITS,
  INSPECTION_ITEM_OUTCOMES,
  INSPECTION_SCOPE_TYPES,
  type DocumentRecord,
  type InspectionItemOutcome,
  type InspectionScopeType
} from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Select, Skeleton, Textarea } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type SiteOption = { id: string; name: string };
type AssetOption = { id: string; name: string; site_id: string };
type SystemOption = { id: string; name: string; site_id: string };

type ChecklistItem = { key: string; label: string; required?: boolean };

type Program = {
  id: string;
  name: string;
  status: string;
  scope_type: string;
  cadence_unit: string;
  cadence_interval: number;
  next_due_on: string | null;
  checklist_template: ChecklistItem[];
  facility_sites?: { name: string } | null;
  facility_assets?: { name: string } | null;
  facility_systems?: { name: string } | null;
};

type ResultItem = {
  key: string;
  label: string;
  outcome: InspectionItemOutcome;
  notes?: string | null;
  spawnWorkOrder?: boolean;
};

type Run = {
  id: string;
  program_id: string;
  status: string;
  due_on: string | null;
  started_at: string | null;
  completed_at: string | null;
  results: ResultItem[];
  completion_notes: string | null;
  workOrderIds?: string[];
  facility_inspection_programs?: { name: string; checklist_template: ChecklistItem[] } | null;
  facility_sites?: { name: string } | null;
};

type Summary = {
  programCount: number;
  activeProgramCount: number;
  dueProgramCount: number;
  inProgressRunCount: number;
  failedRunCount: number;
};

export function InspectionsDirectory() {
  const searchParams = useSearchParams();
  const preferredRunId = searchParams.get("runId") ?? "";
  const startWithCreate = searchParams.get("new") === "1";

  const [programs, setPrograms] = useState<Program[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [systems, setSystems] = useState<SystemOption[]>([]);
  const [summary, setSummary] = useState<Summary>({
    programCount: 0,
    activeProgramCount: 0,
    dueProgramCount: 0,
    inProgressRunCount: 0,
    failedRunCount: 0
  });
  const [assistantRecommendation, setAssistantRecommendation] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [listView, setListView] = useState<"programs" | "runs">("programs");
  const [programFilter, setProgramFilter] = useState<"all" | "due" | "active">("all");
  const [creating, setCreating] = useState(false);
  const [createDismissed, setCreateDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [siteId, setSiteId] = useState("");
  const [scopeType, setScopeType] = useState<InspectionScopeType>("site");
  const [assetId, setAssetId] = useState("");
  const [systemId, setSystemId] = useState("");
  const [programName, setProgramName] = useState("");
  const [cadenceUnit, setCadenceUnit] =
    useState<(typeof INSPECTION_CADENCE_UNITS)[number]>("month");
  const [cadenceInterval, setCadenceInterval] = useState(1);
  const [nextDueOn, setNextDueOn] = useState(new Date().toISOString().slice(0, 10));
  const [activate, setActivate] = useState(true);
  const [programNotes, setProgramNotes] = useState("");
  const [checklistRows, setChecklistRows] = useState<ChecklistItem[]>([
    { key: "item_1", label: "General condition", required: true }
  ]);

  const [completionNotes, setCompletionNotes] = useState("");
  const [resultRows, setResultRows] = useState<ResultItem[]>([]);
  const [cancelReason, setCancelReason] = useState("");
  const [runDocuments, setRunDocuments] = useState<DocumentRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const [evidenceBase64, setEvidenceBase64] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const selectedProgram = useMemo(
    () => programs.find((row) => row.id === selectedProgramId) ?? null,
    [programs, selectedProgramId]
  );

  const selectedRun = useMemo(
    () => runs.find((row) => row.id === selectedRunId) ?? null,
    [runs, selectedRunId]
  );

  const filteredPrograms = useMemo(() => {
    if (programFilter === "due") {
      return programs.filter(
        (p) => p.status === "active" && p.next_due_on != null && p.next_due_on <= today
      );
    }
    if (programFilter === "active") {
      return programs.filter((p) => p.status === "active");
    }
    return programs;
  }, [programFilter, programs, today]);

  const siteAssets = assets.filter((a) => a.site_id === siteId);
  const siteSystems = systems.filter((s) => s.site_id === siteId);

  const showCreate =
    creating || ((startWithCreate || (!loading && programs.length === 0)) && !createDismissed);

  const refresh = useCallback(
    async (preferredRun?: string) => {
      const response = await fetch("/api/facility/inspections");
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to load inspections");
      }
      const programRows = (body.programs ?? []) as Program[];
      const runRows = (body.runs ?? []) as Run[];
      setPrograms(programRows);
      setRuns(runRows);
      setSummary(body.summary ?? {});
      setAssistantRecommendation(body.assistantRecommendation ?? "");
      setSites(body.sites ?? []);
      setAssets(body.assets ?? []);
      setSystems(body.systems ?? []);
      if (body.sites?.[0] && !siteId) {
        setSiteId((body.sites as SiteOption[])[0]!.id);
      }
      const nextRunId =
        preferredRun ||
        preferredRunId ||
        selectedRunId ||
        runRows.find((r) => r.status === "in_progress")?.id ||
        "";
      setSelectedRunId(nextRunId);
      if (nextRunId) {
        setListView("runs");
        const run = runRows.find((r) => r.id === nextRunId);
        if (run?.status === "in_progress") {
          setResultRows(
            run.results.map((item) => ({
              ...item,
              outcome: item.outcome === "not_checked" ? "pass" : item.outcome
            }))
          );
        }
      }
      if (!selectedProgramId && programRows[0]) {
        setSelectedProgramId(programRows[0].id);
      }
    },
    [preferredRunId, selectedProgramId, selectedRunId, siteId]
  );

  const loadRunDocuments = useCallback(async (runId: string) => {
    if (!runId) {
      setRunDocuments([]);
      return;
    }
    setDocsLoading(true);
    try {
      const params = new URLSearchParams({
        entityType: "facility_inspection_run",
        entityId: runId
      });
      const response = await fetch(`/api/shared/documents?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to load documents");
      }
      setRunDocuments((body.documents ?? []) as DocumentRecord[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (listView === "runs" && selectedRunId) {
      void loadRunDocuments(selectedRunId);
    } else {
      setRunDocuments([]);
    }
  }, [listView, loadRunDocuments, selectedRunId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh(preferredRunId || undefined);
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
      await refresh(selectedRunId || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function createProgram(event: FormEvent) {
    event.preventDefault();
    await runAction(async () => {
      const response = await fetch("/api/facility/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          assetId: scopeType === "asset" ? assetId : null,
          systemId: scopeType === "system" ? systemId : null,
          name: programName.trim(),
          scopeType,
          cadenceUnit,
          cadenceInterval,
          nextDueOn,
          checklistTemplate: checklistRows.map((row) => ({
            key: row.key.trim(),
            label: row.label.trim(),
            required: row.required ?? true
          })),
          notes: programNotes.trim() || null,
          activate
        })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to create program");
      }
      setCreating(false);
      setCreateDismissed(true);
      setSelectedProgramId(body.program.id as string);
      setNotice("Inspection program created.");
    });
  }

  async function startRun(programId: string) {
    await runAction(async () => {
      const response = await fetch("/api/facility/inspections/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to start run");
      }
      const run = body.run as Run;
      setSelectedRunId(run.id);
      setListView("runs");
      setResultRows(
        (run.results ?? []).map((item) => ({
          ...item,
          outcome: item.outcome === "not_checked" ? "pass" : item.outcome
        }))
      );
      setNotice("Inspection run started.");
    });
  }

  async function completeRun(event: FormEvent) {
    event.preventDefault();
    if (!selectedRunId) {
      return;
    }
    await runAction(async () => {
      const response = await fetch(
        `/api/facility/inspections/runs/${selectedRunId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            results: resultRows.map((row) => ({
              key: row.key,
              label: row.label,
              outcome: row.outcome,
              notes: row.notes?.trim() || null,
              spawnWorkOrder: row.outcome === "fail" ? false : row.spawnWorkOrder ?? false
            })),
            completionNotes: completionNotes.trim() || null
          })
        }
      );
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to complete run");
      }
      const spawned = (body.run?.workOrderIds ?? []) as string[];
      setNotice(
        spawned.length > 0
          ? `Run completed. ${spawned.length} corrective work order(s) spawned.`
          : "Run completed."
      );
      setCompletionNotes("");
    });
  }

  async function cancelRun() {
    if (!selectedRunId || !cancelReason.trim()) {
      return;
    }
    await runAction(async () => {
      const response = await fetch(`/api/facility/inspections/runs/${selectedRunId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Failed to cancel run");
      }
      setCancelReason("");
      setNotice("Run cancelled.");
    });
  }

  function runStatusBadge(status: string) {
    if (status === "completed_fail") {
      return <Badge variant="danger">failed</Badge>;
    }
    if (status === "completed_pass") {
      return <Badge variant="success">passed</Badge>;
    }
    if (status === "in_progress") {
      return <Badge variant="warning">in progress</Badge>;
    }
    if (status === "cancelled") {
      return <Badge variant="neutral">cancelled</Badge>;
    }
    return <Badge variant="neutral">{status}</Badge>;
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
          { label: "Inspections" }
        ]}
      />

      <header className="flex max-w-5xl flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold">Inspections</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Facility inspection programs and checklist runs. Failed items spawn corrective work
            automatically.
          </p>
        </div>
        {!showCreate ? (
          <Button
            type="button"
            onClick={() => {
              setCreating(true);
              setCreateDismissed(false);
            }}
          >
            Create program
          </Button>
        ) : null}
      </header>

      <section className="flex max-w-3xl flex-wrap gap-2">
        <Badge variant={summary.dueProgramCount > 0 ? "warning" : "neutral"}>
          {summary.dueProgramCount} due
        </Badge>
        <Badge variant={summary.inProgressRunCount > 0 ? "warning" : "neutral"}>
          {summary.inProgressRunCount} in progress
        </Badge>
        <Badge variant={summary.failedRunCount > 0 ? "danger" : "neutral"}>
          {summary.failedRunCount} failed
        </Badge>
        <Badge variant="neutral">{summary.activeProgramCount} active programs</Badge>
      </section>

      <section className="max-w-3xl rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant recommendation
        </p>
        <p className="mt-1">{assistantRecommendation}</p>
      </section>

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-800">{notice}</p> : null}

      {showCreate ? (
        <form
          onSubmit={(event) => void createProgram(event)}
          className="max-w-2xl space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        >
          <h2 className="text-base font-semibold">Create inspection program</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>Name</span>
              <Input
                required
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="Monthly roof walk"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>Site</span>
              <Select value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span>Scope</span>
            <Select
              value={scopeType}
              onChange={(e) => setScopeType(e.target.value as InspectionScopeType)}
            >
              {INSPECTION_SCOPE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </label>
          {scopeType === "asset" ? (
            <label className="block space-y-1 text-sm">
              <span>Asset</span>
              <Select value={assetId} onChange={(e) => setAssetId(e.target.value)} required>
                <option value="">Select asset</option>
                {siteAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
          {scopeType === "system" ? (
            <label className="block space-y-1 text-sm">
              <span>Building system</span>
              <Select value={systemId} onChange={(e) => setSystemId(e.target.value)} required>
                <option value="">Select system</option>
                {siteSystems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.name}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span>Cadence unit</span>
              <Select
                value={cadenceUnit}
                onChange={(e) =>
                  setCadenceUnit(e.target.value as (typeof INSPECTION_CADENCE_UNITS)[number])
                }
              >
                {INSPECTION_CADENCE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              <span>Interval</span>
              <Input
                type="number"
                min={1}
                value={cadenceInterval}
                onChange={(e) => setCadenceInterval(Number(e.target.value) || 1)}
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>First due</span>
              <Input type="date" value={nextDueOn} onChange={(e) => setNextDueOn(e.target.value)} />
            </label>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Checklist items</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setChecklistRows((rows) => [
                    ...rows,
                    {
                      key: `item_${rows.length + 1}`,
                      label: "",
                      required: true
                    }
                  ])
                }
              >
                Add row
              </Button>
            </div>
            {checklistRows.map((row, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
                <Input
                  value={row.key}
                  onChange={(e) =>
                    setChecklistRows((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, key: e.target.value } : r))
                    )
                  }
                  placeholder="key"
                  required
                />
                <Input
                  value={row.label}
                  onChange={(e) =>
                    setChecklistRows((rows) =>
                      rows.map((r, i) => (i === index ? { ...r, label: e.target.value } : r))
                    )
                  }
                  placeholder="Label"
                  required
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={checklistRows.length <= 1}
                  onClick={() => setChecklistRows((rows) => rows.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <label className="block space-y-1 text-sm">
            <span>Notes</span>
            <Textarea value={programNotes} onChange={(e) => setProgramNotes(e.target.value)} rows={2} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} />
            Activate immediately
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || sites.length === 0}>
              Create program
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCreating(false);
                setCreateDismissed(true);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={listView === "programs" ? "primary" : "secondary"}
          onClick={() => setListView("programs")}
        >
          Programs
        </Button>
        <Button
          type="button"
          size="sm"
          variant={listView === "runs" ? "primary" : "secondary"}
          onClick={() => setListView("runs")}
        >
          Runs
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          {listView === "programs" ? (
            <>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All"],
                    ["due", "Due"],
                    ["active", "Active"]
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={programFilter === value ? "primary" : "secondary"}
                    onClick={() => setProgramFilter(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {filteredPrograms.length === 0 ? (
                <EmptyState
                  title="No programs"
                  description="Create an inspection program with a checklist template."
                />
              ) : (
                <ul className="divide-y divide-[var(--mpa-color-border-default)]">
                  {filteredPrograms.map((program) => (
                    <li key={program.id}>
                      <button
                        type="button"
                        className={`w-full px-1 py-3 text-left ${
                          selectedProgramId === program.id ? "bg-[var(--mpa-color-bg-subtle)]" : ""
                        }`}
                        onClick={() => setSelectedProgramId(program.id)}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{program.name}</span>
                          <Badge variant="neutral">{program.status}</Badge>
                          {program.next_due_on && program.next_due_on <= today ? (
                            <Badge variant="warning">due</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                          {program.facility_sites?.name}
                          {program.facility_assets?.name ? ` · ${program.facility_assets.name}` : ""}
                          {program.facility_systems?.name
                            ? ` · ${program.facility_systems.name}`
                            : ""}
                          {program.next_due_on ? ` · next ${program.next_due_on}` : ""}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              {runs.length === 0 ? (
                <EmptyState title="No runs" description="Start a run from an active program." />
              ) : (
                <ul className="divide-y divide-[var(--mpa-color-border-default)]">
                  {runs.map((run) => (
                    <li key={run.id}>
                      <button
                        type="button"
                        className={`w-full px-1 py-3 text-left ${
                          selectedRunId === run.id ? "bg-[var(--mpa-color-bg-subtle)]" : ""
                        }`}
                        onClick={() => {
                          setSelectedRunId(run.id);
                          if (run.status === "in_progress") {
                            setResultRows(
                              run.results.map((item) => ({
                                ...item,
                                outcome:
                                  item.outcome === "not_checked" ? "pass" : item.outcome
                              }))
                            );
                          }
                        }}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {run.facility_inspection_programs?.name ?? "Inspection"}
                          </span>
                          {runStatusBadge(run.status)}
                        </div>
                        <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                          {run.facility_sites?.name}
                          {run.due_on ? ` · due ${run.due_on}` : ""}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          {listView === "programs" && selectedProgram ? (
            <>
              <h2 className="text-lg font-semibold">{selectedProgram.name}</h2>
              <dl className="grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-[var(--mpa-color-text-secondary)]">Status</dt>
                  <dd>{selectedProgram.status}</dd>
                </div>
                <div>
                  <dt className="text-[var(--mpa-color-text-secondary)]">Cadence</dt>
                  <dd>
                    Every {selectedProgram.cadence_interval} {selectedProgram.cadence_unit}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--mpa-color-text-secondary)]">Next due</dt>
                  <dd>{selectedProgram.next_due_on ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--mpa-color-text-secondary)]">Scope</dt>
                  <dd>{selectedProgram.scope_type}</dd>
                </div>
              </dl>
              <div>
                <h3 className="text-sm font-semibold">Checklist template</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {selectedProgram.checklist_template.map((item) => (
                    <li key={item.key}>
                      {item.key} · {item.label}
                    </li>
                  ))}
                </ul>
              </div>
              {selectedProgram.status === "active" ? (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void startRun(selectedProgram.id)}
                >
                  Start inspection run
                </Button>
              ) : null}
            </>
          ) : null}

          {listView === "runs" && selectedRun ? (
            <>
              <h2 className="text-lg font-semibold">
                {selectedRun.facility_inspection_programs?.name ?? "Inspection run"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {runStatusBadge(selectedRun.status)}
                {selectedRun.due_on ? (
                  <Badge variant="neutral">due {selectedRun.due_on}</Badge>
                ) : null}
              </div>
              {selectedRun.status === "in_progress" ? (
                <form onSubmit={(event) => void completeRun(event)} className="space-y-3">
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    Set outcome per checklist item. Failures spawn corrective work automatically.
                  </p>
                  {resultRows.map((row, index) => (
                    <div
                      key={row.key}
                      className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] p-3"
                    >
                      <p className="text-sm font-medium">{row.label}</p>
                      <Select
                        value={row.outcome}
                        onChange={(e) =>
                          setResultRows((rows) =>
                            rows.map((r, i) =>
                              i === index
                                ? {
                                    ...r,
                                    outcome: e.target.value as InspectionItemOutcome
                                  }
                                : r
                            )
                          )
                        }
                      >
                        {INSPECTION_ITEM_OUTCOMES.filter((o) => o !== "not_checked").map(
                          (outcome) => (
                            <option key={outcome} value={outcome}>
                              {outcome}
                            </option>
                          )
                        )}
                      </Select>
                      <Textarea
                        placeholder="Notes"
                        rows={2}
                        value={row.notes ?? ""}
                        onChange={(e) =>
                          setResultRows((rows) =>
                            rows.map((r, i) =>
                              i === index ? { ...r, notes: e.target.value } : r
                            )
                          )
                        }
                      />
                      {row.outcome === "needs_attention" ? (
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={row.spawnWorkOrder ?? false}
                            onChange={(e) =>
                              setResultRows((rows) =>
                                rows.map((r, i) =>
                                  i === index ? { ...r, spawnWorkOrder: e.target.checked } : r
                                )
                              )
                            }
                          />
                          Spawn corrective work order
                        </label>
                      ) : null}
                    </div>
                  ))}
                  <label className="block space-y-1 text-sm">
                    <span>Completion notes</span>
                    <Textarea
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      rows={2}
                    />
                  </label>
                  <Button type="submit" disabled={busy}>
                    Complete run
                  </Button>
                </form>
              ) : (
                <div className="space-y-2 text-sm">
                  {selectedRun.results.map((item) => (
                    <p key={item.key}>
                      {item.label}: {item.outcome}
                      {item.notes ? ` — ${item.notes}` : ""}
                    </p>
                  ))}
                  {selectedRun.completion_notes ? (
                    <p className="text-[var(--mpa-color-text-secondary)]">
                      Notes: {selectedRun.completion_notes}
                    </p>
                  ) : null}
                  {(selectedRun.workOrderIds ?? []).length > 0 ? (
                    <ul>
                      {selectedRun.workOrderIds!.map((woId) => (
                        <li key={woId}>
                          <Link
                            href={`/facility/operations?workOrderId=${woId}`}
                            className="underline"
                          >
                            Work order {woId}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
              <div className="space-y-3 border-t border-[var(--mpa-color-border-default)] pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">Inspection evidence</h3>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      Attach and view evidence in the shared Document Vault (
                      <span className="font-mono">facility_inspection_run</span>).
                    </p>
                  </div>
                  <Link
                    href={`/shared/documents?entityType=facility_inspection_run`}
                    className="text-xs underline"
                  >
                    Open Document Vault
                  </Link>
                </div>
                {docsLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : runDocuments.length === 0 ? (
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    No evidence documents attached yet.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {runDocuments.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                            {doc.category} · {doc.createdAt}
                          </p>
                        </div>
                        <Link
                          href={`/shared/documents?documentId=${encodeURIComponent(doc.id)}`}
                          className="text-xs underline"
                        >
                          View
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                    Attach evidence
                  </p>
                  <Input
                    value={evidenceTitle}
                    onChange={(e) => setEvidenceTitle(e.target.value)}
                    placeholder="Document title"
                  />
                  <Textarea
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    rows={2}
                    placeholder="Optional text notes / transcript"
                  />
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (!file) {
                        setEvidenceBase64(null);
                        setEvidenceFileName("");
                        return;
                      }
                      setEvidenceFileName(file.name);
                      if (!evidenceTitle) {
                        setEvidenceTitle(file.name.replace(/\.[^.]+$/, ""));
                      }
                      void file.arrayBuffer().then((buffer) => {
                        const bytes = new Uint8Array(buffer);
                        let binary = "";
                        bytes.forEach((byte) => {
                          binary += String.fromCharCode(byte);
                        });
                        setEvidenceBase64(btoa(binary));
                      });
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      busy ||
                      !evidenceTitle.trim() ||
                      (!evidenceText.trim() && !evidenceBase64)
                    }
                    onClick={() => {
                      void (async () => {
                        setBusy(true);
                        setError(null);
                        setNotice(null);
                        try {
                          const response = await fetch("/api/shared/documents", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              entityType: "facility_inspection_run",
                              entityId: selectedRun.id,
                              title: evidenceTitle.trim(),
                              category: "evidence",
                              fileName: evidenceFileName || undefined,
                              mimeType: evidenceBase64
                                ? "application/octet-stream"
                                : "text/plain",
                              contentText: evidenceText.trim() || undefined,
                              contentBase64: evidenceBase64 || undefined
                            })
                          });
                          const body = await response.json();
                          if (!response.ok) {
                            throw new Error(body.error ?? "Upload failed");
                          }
                          setEvidenceTitle("");
                          setEvidenceText("");
                          setEvidenceFileName("");
                          setEvidenceBase64(null);
                          setNotice("Evidence attached to Document Vault.");
                          await loadRunDocuments(selectedRun.id);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Upload failed");
                        } finally {
                          setBusy(false);
                        }
                      })();
                    }}
                  >
                    Attach to vault
                  </Button>
                </div>
              </div>

              {selectedRun.status === "in_progress" ? (
                <div className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-3">
                  <h3 className="text-sm font-semibold">Cancel run</h3>
                  <Textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={2}
                    placeholder="Reason for cancellation"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={busy || cancelReason.trim().length < 3}
                    onClick={() => void cancelRun()}
                  >
                    Cancel run
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}

          {listView === "programs" && !selectedProgram ? (
            <EmptyState title="Select a program" description="Review checklist and start runs." />
          ) : null}
          {listView === "runs" && !selectedRun ? (
            <EmptyState title="Select a run" description="Complete in-progress checklists." />
          ) : null}
        </section>
      </div>
    </main>
  );
}
