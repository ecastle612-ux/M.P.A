"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PM_RECURRENCE_KINDS,
  WORK_ORDER_PRIORITIES,
  isPlanDueSoon,
  isPlanOverdue,
  recurrenceLabel,
  utcToday,
  type PmRecurrenceKind,
  type WorkOrderPriority
} from "@mpa/shared";
import { Alert, Badge, Button, EmptyState, Input, Select, Skeleton } from "@mpa/ui";
import { RememberRecent } from "../shell/remember-recent";
import { FoPageChrome, FoQuickActions } from "../shell/fo-workspace";

type PlanRow = {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "inactive";
  target_kind: "asset" | "location";
  facility_asset_id: string | null;
  property_id: string | null;
  floor_label: string | null;
  department_label: string | null;
  room_label: string | null;
  priority: WorkOrderPriority;
  recurrence_kind: PmRecurrenceKind;
  interval_n: number;
  next_due_on: string;
  generate_days_before: number;
  template_id: string | null;
  missed_occurrence_count: number;
  facility_assets?: { id: string; name: string; asset_code: string } | null;
  property_properties?: { id: string; name: string } | null;
  facility_work_templates?: { id: string; name: string } | null;
};

type OccurrenceRow = {
  id: string;
  occurrence_due_on: string;
  work_order_id: string | null;
  generated_at: string;
  maintenance_work_orders?: {
    id: string;
    title: string;
    status: string;
    completed_at: string | null;
  } | null;
};

function statusBadge(status: PlanRow["status"]) {
  if (status === "active") return <Badge variant="success">Active</Badge>;
  if (status === "paused") return <Badge variant="warning">Paused</Badge>;
  return <Badge variant="neutral">Inactive</Badge>;
}

function PlanScheduleEditor({
  plan,
  templates,
  busy,
  onSave
}: {
  plan: PlanRow;
  templates: Array<{ id: string; name: string }>;
  busy: boolean;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [nextDueOn, setNextDueOn] = useState(plan.next_due_on);
  const [recurrenceKind, setRecurrenceKind] = useState<PmRecurrenceKind>(plan.recurrence_kind);
  const [intervalN, setIntervalN] = useState(String(plan.interval_n));
  const [generateDaysBefore, setGenerateDaysBefore] = useState(String(plan.generate_days_before));
  const [description, setDescription] = useState(plan.description);
  const [templateId, setTemplateId] = useState(plan.template_id ?? "");

  return (
    <form
      className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          nextDueOn,
          recurrenceKind,
          ...(recurrenceKind === "every_n_weeks" || recurrenceKind === "every_n_months"
            ? { intervalN: Number(intervalN) }
            : {}),
          generateDaysBefore: Number(generateDaysBefore),
          description,
          templateId: templateId || null
        });
      }}
    >
      <h3 className="text-sm font-semibold">Edit future schedule</h3>
      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
        Changes apply to the next due date only. Generated work, checklists, and history stay as they are.
      </p>
      <label className="text-sm">
        Next due
        <Input type="date" value={nextDueOn} onChange={(event) => setNextDueOn(event.target.value)} required />
      </label>
      <Select value={recurrenceKind} onChange={(event) => setRecurrenceKind(event.target.value as PmRecurrenceKind)}>
        {PM_RECURRENCE_KINDS.map((kind) => (
          <option key={kind} value={kind}>
            {recurrenceLabel(kind, kind === "every_n_months" || kind === "every_n_weeks" ? Number(intervalN) || 1 : 1)}
          </option>
        ))}
      </Select>
      {recurrenceKind === "every_n_weeks" || recurrenceKind === "every_n_months" ? (
        <Input type="number" min={1} max={52} value={intervalN} onChange={(event) => setIntervalN(event.target.value)} />
      ) : null}
      <label className="text-sm">
        Generate work days before
        <Input
          type="number"
          min={0}
          max={90}
          value={generateDaysBefore}
          onChange={(event) => setGenerateDaysBefore(event.target.value)}
        />
      </label>
      <textarea
        className="min-h-20 rounded-md border border-[var(--mpa-color-border-default)] p-3 text-sm"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Instructions for the technician"
      />
      <Select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
        <option value="">No work template</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={busy}>
        Save future schedule
      </Button>
    </form>
  );
}

export function FacilityPmWorkspace() {
  const searchParams = useSearchParams();
  const startCreate = searchParams.get("new") === "1";
  const prefillAssetId = searchParams.get("facilityAssetId") ?? "";
  const prefillPropertyId = searchParams.get("propertyId") ?? "";
  const selectedPlanId = searchParams.get("planId") ?? "";

  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [assets, setAssets] = useState<Array<{ id: string; name: string; asset_code: string }>>([]);
  const [properties, setProperties] = useState<Array<{ id: string; name: string }>>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [summary, setSummary] = useState({ activePlans: 0, dueSoon: 0, overdue: 0, paused: 0 });
  const [filter, setFilter] = useState<"all" | "upcoming" | "overdue" | "paused">("all");
  const [occurrencesByPlan, setOccurrencesByPlan] = useState<Record<string, OccurrenceRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(startCreate);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetKind, setTargetKind] = useState<"asset" | "location">(prefillAssetId ? "asset" : "location");
  const [facilityAssetId, setFacilityAssetId] = useState(prefillAssetId);
  const [propertyId, setPropertyId] = useState(prefillPropertyId);
  const [floorLabel, setFloorLabel] = useState("");
  const [departmentLabel, setDepartmentLabel] = useState("");
  const [roomLabel, setRoomLabel] = useState("");
  const [priority, setPriority] = useState<WorkOrderPriority>("normal");
  const [recurrenceKind, setRecurrenceKind] = useState<PmRecurrenceKind>("quarterly");
  const [intervalN, setIntervalN] = useState("3");
  const [nextDueOn, setNextDueOn] = useState("");
  const [generateDaysBefore, setGenerateDaysBefore] = useState("7");
  const [templateId, setTemplateId] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/facility/preventive-maintenance");
    const body = (await response.json()) as {
      plans?: PlanRow[];
      assets?: Array<{ id: string; name: string; asset_code: string }>;
      properties?: Array<{ id: string; name: string }>;
      templates?: Array<{ id: string; name: string }>;
      summary?: { activePlans: number; dueSoon: number; overdue: number; paused: number };
      error?: string;
    };
    if (!response.ok) throw new Error(body.error ?? "Failed to load Preventive Maintenance");
    setPlans(body.plans ?? []);
    setAssets(body.assets ?? []);
    setProperties(body.properties ?? []);
    setTemplates(body.templates ?? []);
    setSummary(body.summary ?? { activePlans: 0, dueSoon: 0, overdue: 0, paused: 0 });
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch
    void refresh()
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh, reloadToken]);

  const today = utcToday();
  const selected = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );
  const visiblePlans = useMemo(() => {
    return plans.filter((plan) => {
      if (filter === "paused") return plan.status === "paused";
      if (filter === "overdue") return plan.status === "active" && isPlanOverdue(plan.next_due_on, today);
      if (filter === "upcoming") return plan.status === "active" && !isPlanOverdue(plan.next_due_on, today);
      return true;
    });
  }, [filter, plans, today]);

  useEffect(() => {
    if (!selectedPlanId) return;
    const planId = selectedPlanId;
    let cancelled = false;
    void (async () => {
      const response = await fetch(`/api/facility/preventive-maintenance/${planId}`);
      const body = (await response.json()) as { occurrences?: OccurrenceRow[] };
      if (!cancelled && response.ok) {
        setOccurrencesByPlan((current) => ({ ...current, [planId]: body.occurrences ?? [] }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPlanId, reloadToken]);

  async function patchPlan(planId: string, payload: Record<string, unknown>, okMessage: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/facility/preventive-maintenance/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Update failed");
      setNotice(okMessage);
      setReloadToken((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <FoPageChrome
        crumbs={[
          { href: "/facility/mission-control", label: "Facility Mission Control" },
          { label: "Preventive Maintenance" }
        ]}
        title="Preventive Maintenance"
      >
        <Skeleton className="h-32" />
      </FoPageChrome>
    );
  }

  return (
    <FoPageChrome
      crumbs={[
        { href: "/facility/mission-control", label: "Facility Mission Control" },
        { href: "/facility/preventive-maintenance", label: "Preventive Maintenance" },
        ...(selected ? [{ label: selected.name }] : [])
      ]}
      title={selected ? selected.name : "Preventive Maintenance"}
      description="Schedule repeating facility work. When it is due, M.P.A. creates one work order."
    >
      {selected ? <RememberRecent type="pm_plan" id={selected.id} /> : null}
      <FoQuickActions
        actions={[
          { href: "/facility/preventive-maintenance?new=1", label: "Create plan", primary: true },
          { href: "/facility/operations", label: "Operations" },
          { href: "/facility/assets", label: "Assets" }
        ]}
      />
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 text-sm">
          <span className="block text-xs uppercase text-[var(--mpa-color-text-secondary)]">Active plans</span>
          {summary.activePlans}
        </p>
        <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 text-sm">
          <span className="block text-xs uppercase text-[var(--mpa-color-text-secondary)]">Due soon</span>
          {summary.dueSoon}
        </p>
        <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 text-sm">
          <span className="block text-xs uppercase text-[var(--mpa-color-text-secondary)]">Overdue</span>
          {summary.overdue}
        </p>
        <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 text-sm">
          <span className="block text-xs uppercase text-[var(--mpa-color-text-secondary)]">Paused</span>
          {summary.paused}
        </p>
      </section>

      {creating ? (
        <form
          className="grid max-w-xl gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              setBusy(true);
              setError(null);
              try {
                const response = await fetch("/api/facility/preventive-maintenance", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                    targetKind,
                    ...(targetKind === "asset" ? { facilityAssetId } : { propertyId, floorLabel, departmentLabel, roomLabel }),
                    priority,
                    recurrenceKind,
                    ...(recurrenceKind === "every_n_weeks" || recurrenceKind === "every_n_months"
                      ? { intervalN: Number(intervalN) }
                      : {}),
                    nextDueOn,
                    generateDaysBefore: Number(generateDaysBefore),
                    ...(templateId ? { templateId } : {})
                  })
                });
                const body = (await response.json()) as { error?: string };
                if (!response.ok) throw new Error(body.error ?? "Could not create plan");
                setCreating(false);
                setName("");
                setDescription("");
                setNotice("Plan created. Work will generate before the next due date.");
                setReloadToken((value) => value + 1);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not create plan");
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <h2 className="text-sm font-semibold">Create plan</h2>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Quarterly chair inspection" required />
          <textarea
            className="min-h-24 rounded-md border border-[var(--mpa-color-border-default)] p-3 text-sm"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Instructions for the technician"
          />
          <Select value={targetKind} onChange={(event) => setTargetKind(event.target.value as "asset" | "location")}>
            <option value="asset">Asset</option>
            <option value="location">Building / location</option>
          </Select>
          {targetKind === "asset" ? (
            <Select value={facilityAssetId} onChange={(event) => setFacilityAssetId(event.target.value)} required>
              <option value="">Choose asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} · {asset.asset_code}
                </option>
              ))}
            </Select>
          ) : (
            <>
              <Select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} required>
                <option value="">Choose building</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </Select>
              <Input value={floorLabel} onChange={(event) => setFloorLabel(event.target.value)} placeholder="Floor" />
              <Input value={departmentLabel} onChange={(event) => setDepartmentLabel(event.target.value)} placeholder="Department" />
              <Input value={roomLabel} onChange={(event) => setRoomLabel(event.target.value)} placeholder="Room / area" />
            </>
          )}
          <Select value={recurrenceKind} onChange={(event) => setRecurrenceKind(event.target.value as PmRecurrenceKind)}>
            {PM_RECURRENCE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {recurrenceLabel(kind, kind === "every_n_months" || kind === "every_n_weeks" ? Number(intervalN) || 1 : 1)}
              </option>
            ))}
          </Select>
          {recurrenceKind === "every_n_weeks" || recurrenceKind === "every_n_months" ? (
            <Input
              type="number"
              min={1}
              max={52}
              value={intervalN}
              onChange={(event) => setIntervalN(event.target.value)}
              placeholder="How often"
            />
          ) : null}
          <label className="text-sm">
            Next due
            <Input type="date" value={nextDueOn} onChange={(event) => setNextDueOn(event.target.value)} required />
          </label>
          <label className="text-sm">
            Generate work days before
            <Input
              type="number"
              min={0}
              max={90}
              value={generateDaysBefore}
              onChange={(event) => setGenerateDaysBefore(event.target.value)}
            />
          </label>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Example: due in 7 days with generate work 7 days before creates the work order today.
          </p>
          <Select value={priority} onChange={(event) => setPriority(event.target.value as WorkOrderPriority)}>
            {WORK_ORDER_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            <option value="">No work template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              Save plan
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {selected ? (
        <section className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(selected.status)}
            <p className="text-sm">
              {recurrenceLabel(selected.recurrence_kind, selected.interval_n)} · Next due {selected.next_due_on}
            </p>
          </div>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {selected.facility_assets?.name ?? selected.property_properties?.name ?? "Location"}
            {selected.floor_label ? ` · Floor ${selected.floor_label}` : ""}
            {selected.department_label ? ` · ${selected.department_label}` : ""}
            {selected.room_label ? ` · ${selected.room_label}` : ""}
          </p>
          <p className="text-sm">Generate work {selected.generate_days_before} days before</p>
          {selected.description ? <p className="text-sm">{selected.description}</p> : null}
          {selected.missed_occurrence_count > 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {selected.missed_occurrence_count} missed occurrence(s) recorded. No fake completions were created.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {selected.status === "active" ? (
              <Button type="button" disabled={busy} onClick={() => void patchPlan(selected.id, { action: "pause" }, "Paused. Existing work stays.")}>
                Pause
              </Button>
            ) : null}
            {selected.status === "paused" ? (
              <Button type="button" disabled={busy} onClick={() => void patchPlan(selected.id, { action: "resume" }, "Resumed. Next due is the next valid date.")}>
                Resume
              </Button>
            ) : null}
            {selected.status !== "inactive" ? (
              <Button type="button" variant="secondary" disabled={busy} onClick={() => void patchPlan(selected.id, { action: "deactivate" }, "Deactivated. History remains.")}>
                Deactivate
              </Button>
            ) : null}
          </div>
          {selected.status !== "inactive" ? (
            <PlanScheduleEditor
              key={`${selected.id}-${reloadToken}`}
              plan={selected}
              templates={templates}
              busy={busy}
              onSave={(payload) =>
                void patchPlan(selected.id, payload, "Future schedule updated. Existing work is unchanged.")
              }
            />
          ) : null}
          <h3 className="text-sm font-semibold">History</h3>
          {(occurrencesByPlan[selected.id] ?? []).length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No generated work yet.</p>
          ) : (
            <ul className="grid gap-2">
              {(occurrencesByPlan[selected.id] ?? []).map((row) => (
                <li key={row.id} className="text-sm">
                  Due {row.occurrence_due_on}
                  {row.maintenance_work_orders ? (
                    <>
                      {" · "}
                      <Link
                        className="min-h-11 inline-flex items-center text-[var(--mpa-color-brand-primary)] underline"
                        href={`/facility/operations?workOrderId=${row.maintenance_work_orders.id}`}
                      >
                        {row.maintenance_work_orders.title} ({row.maintenance_work_orders.status})
                      </Link>
                    </>
                  ) : (
                    " · work not linked"
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Plans</h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["upcoming", "Upcoming"],
                ["overdue", "Overdue"],
                ["paused", "Paused"]
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
        </div>
        {plans.length === 0 ? (
          <EmptyState
            title="No Preventive Maintenance plans"
            description="Create a plan from an asset or a building. Work appears in Operations and My Work when it is due."
          />
        ) : visiblePlans.length === 0 ? (
          <EmptyState title="No plans in this view" description="Try All, Upcoming, Overdue, or Paused." />
        ) : (
          <ul className="grid gap-3">
            {visiblePlans.map((plan) => (
              <li key={plan.id}>
                <Link
                  href={`/facility/preventive-maintenance?planId=${plan.id}`}
                  className="block min-h-11 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{plan.name}</p>
                    {statusBadge(plan.status)}
                  </div>
                  <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                    {recurrenceLabel(plan.recurrence_kind, plan.interval_n)} · Next due {plan.next_due_on}
                    {plan.status === "active" && isPlanDueSoon(plan.next_due_on, today) ? " · Due soon" : ""}
                    {plan.status === "active" && isPlanOverdue(plan.next_due_on, today) ? " · Overdue" : ""}
                  </p>
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                    {plan.facility_assets?.name ?? plan.property_properties?.name ?? "Building / location"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </FoPageChrome>
  );
}
