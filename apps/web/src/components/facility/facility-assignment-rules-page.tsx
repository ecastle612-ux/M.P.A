"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ASSIGNMENT_RULE_CONDITION_LABELS,
  FACILITY_ASSET_TYPE_LABELS,
  ORIGIN_SOURCE_LABELS,
  WORK_ORDER_CATEGORIES,
  WORK_ORDER_CATEGORY_LABELS,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_PRIORITY_LABELS,
  describeAssignmentRule,
  type AssignmentRuleConditionKey,
  type AssignmentRuleConditions,
  type AssignmentWorkFacts
} from "@mpa/shared";
import { Alert, Badge, Button, Input, Select } from "@mpa/ui";
import { FoPageChrome } from "../shell/fo-workspace";

type RuleRow = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  sort_order: number;
  assignee_user_id: string;
  conditions: AssignmentRuleConditions;
};

type EvaluationRow = {
  id: string;
  work_order_id: string;
  rule_id: string | null;
  result: string;
  reason: string;
  assigned_user_id: string | null;
  trigger: string;
  evaluated_at: string;
  rule_snapshot: { name?: string };
};

type Catalog = {
  rules: RuleRow[];
  technicians: Array<{ userId: string; displayName: string }>;
  properties: Array<{ id: string; name: string }>;
  assets: Array<{ id: string; name: string; asset_type: string; asset_code: string }>;
  forms: Array<{ id: string; name: string; status: string }>;
  templates: Array<{ id: string; name: string; status: string }>;
  evaluations: EvaluationRow[];
};

const CONDITION_OPTIONS = Object.entries(ASSIGNMENT_RULE_CONDITION_LABELS) as Array<
  [AssignmentRuleConditionKey, string]
>;

const emptyConditions = (): AssignmentRuleConditions => ({});

function technicianName(catalog: Catalog, userId: string) {
  return catalog.technicians.find((row) => row.userId === userId)?.displayName ?? "Staff member";
}

function conditionSummary(rule: RuleRow, catalog: Catalog) {
  return describeAssignmentRule(
    { name: rule.name, conditions: rule.conditions },
    technicianName(catalog, rule.assignee_user_id)
  );
}

export function FacilityAssignmentRulesPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("Plumbing to Mike");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [conditions, setConditions] = useState<AssignmentRuleConditions>({ category: "plumbing" });
  const [preview, setPreview] = useState<string | null>(null);
  const [sample, setSample] = useState<AssignmentWorkFacts>({
    category: "plumbing",
    priority: "normal",
    originSource: "public_request"
  });

  async function refresh() {
    const response = await fetch("/api/facility/assignment-rules");
    const body = (await response.json()) as Catalog & { error?: string };
    if (!response.ok) throw new Error(body.error ?? "Could not load assignment rules.");
    setCatalog(body);
    if (!assigneeUserId && body.technicians[0]) {
      setAssigneeUserId(body.technicians[0].userId);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load assignment rules.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ordered = useMemo(
    () => [...(catalog?.rules ?? [])].sort((left, right) => left.sort_order - right.sort_order),
    [catalog]
  );

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  function setCondition<K extends AssignmentRuleConditionKey>(key: K, value: string) {
    setConditions((current) => {
      const next = { ...current };
      if (!value) {
        delete next[key];
        return next;
      }
      if (key === "locationLabel") {
        next.locationLabel = value;
        return next;
      }
      (next as Record<string, string>)[key] = value;
      return next;
    });
  }

  if (!catalog) {
    return (
      <FoPageChrome
        crumbs={[
          { href: "/facility/mission-control", label: "Mission Control" },
          { label: "Assignment Rules" }
        ]}
        title="Assignment Rules"
        description="Send new facility work to the right person automatically."
      >
        {error ? <Alert variant="danger">{error}</Alert> : <p>Loading assignment rules…</p>}
      </FoPageChrome>
    );
  }

  return (
    <FoPageChrome
      crumbs={[
        { href: "/facility/mission-control", label: "Mission Control" },
        { href: "/facility/operations", label: "Operations" },
        { label: "Assignment Rules" }
      ]}
      title="Assignment Rules"
      description="First matching active rule assigns new facility work. No match leaves the work Unassigned."
    >
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <section className="space-y-3 rounded-xl border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-semibold">Current rules</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Priority 1 is checked first. Inactive rules stay in the list but do not assign work.
        </p>
        {ordered.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No rules yet. Create one below.</p>
        ) : (
          <ol className="space-y-3">
            {ordered.map((rule, index) => (
              <li
                key={rule.id}
                className="space-y-3 rounded-lg border border-[var(--mpa-color-border-subtle)] p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {rule.sort_order}. {rule.name}
                    </p>
                    <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                      {conditionSummary(rule, catalog)}
                    </p>
                  </div>
                  <Badge variant={rule.status === "active" ? "success" : "neutral"}>
                    {rule.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11"
                    disabled={busy || index === 0}
                    onClick={() =>
                      void run(async () => {
                        const ids = ordered.map((row) => row.id);
                        const swap = [ids[index], ids[index - 1]] as [string, string];
                        ids[index - 1] = swap[0];
                        ids[index] = swap[1];
                        const response = await fetch("/api/facility/assignment-rules/reorder", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ orderedIds: ids })
                        });
                        const body = (await response.json()) as { error?: string };
                        if (!response.ok) throw new Error(body.error ?? "Could not reorder.");
                        setNotice("Priority updated.");
                      })
                    }
                  >
                    Move up
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11"
                    disabled={busy || index === ordered.length - 1}
                    onClick={() =>
                      void run(async () => {
                        const ids = ordered.map((row) => row.id);
                        const swap = [ids[index], ids[index + 1]] as [string, string];
                        ids[index + 1] = swap[0];
                        ids[index] = swap[1];
                        const response = await fetch("/api/facility/assignment-rules/reorder", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ orderedIds: ids })
                        });
                        const body = (await response.json()) as { error?: string };
                        if (!response.ok) throw new Error(body.error ?? "Could not reorder.");
                        setNotice("Priority updated.");
                      })
                    }
                  >
                    Move down
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const response = await fetch(`/api/facility/assignment-rules/${rule.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            status: rule.status === "active" ? "inactive" : "active"
                          })
                        });
                        const body = (await response.json()) as { error?: string };
                        if (!response.ok) throw new Error(body.error ?? "Could not update status.");
                        setNotice(rule.status === "active" ? "Rule deactivated." : "Rule activated.");
                      })
                    }
                  >
                    {rule.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-semibold">Create rule</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          New rules start inactive so you can preview them first.
        </p>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Name</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} className="min-h-11" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Assign to</span>
          <Select
            value={assigneeUserId}
            onChange={(event) => setAssigneeUserId(event.target.value)}
            className="min-h-11"
          >
            <option value="">Select staff member</option>
            {catalog.technicians.map((tech) => (
              <option key={tech.userId} value={tech.userId}>
                {tech.displayName}
              </option>
            ))}
          </Select>
        </label>
        {CONDITION_OPTIONS.map(([key, label]) => (
          <label key={key} className="block space-y-1">
            <span className="text-sm font-medium">{label}</span>
            {key === "category" ? (
              <Select
                value={conditions.category ?? ""}
                onChange={(event) => setCondition("category", event.target.value)}
                className="min-h-11"
              >
                <option value="">Any</option>
                {WORK_ORDER_CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {WORK_ORDER_CATEGORY_LABELS[value]}
                  </option>
                ))}
              </Select>
            ) : null}
            {key === "priority" ? (
              <Select
                value={conditions.priority ?? ""}
                onChange={(event) => setCondition("priority", event.target.value)}
                className="min-h-11"
              >
                <option value="">Any</option>
                {WORK_ORDER_PRIORITIES.map((value) => (
                  <option key={value} value={value}>
                    {WORK_ORDER_PRIORITY_LABELS[value]}
                  </option>
                ))}
              </Select>
            ) : null}
            {key === "propertyId" ? (
              <Select
                value={conditions.propertyId ?? ""}
                onChange={(event) => setCondition("propertyId", event.target.value)}
                className="min-h-11"
              >
                <option value="">Any building</option>
                {catalog.properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </Select>
            ) : null}
            {key === "assetType" ? (
              <Select
                value={conditions.assetType ?? ""}
                onChange={(event) => setCondition("assetType", event.target.value)}
                className="min-h-11"
              >
                <option value="">Any asset category</option>
                {Object.entries(FACILITY_ASSET_TYPE_LABELS).map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </Select>
            ) : null}
            {key === "assetId" ? (
              <Select
                value={conditions.assetId ?? ""}
                onChange={(event) => setCondition("assetId", event.target.value)}
                className="min-h-11"
              >
                <option value="">Any asset</option>
                {catalog.assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </Select>
            ) : null}
            {key === "originSource" ? (
              <Select
                value={conditions.originSource ?? ""}
                onChange={(event) => setCondition("originSource", event.target.value)}
                className="min-h-11"
              >
                <option value="">Any origin</option>
                {Object.entries(ORIGIN_SOURCE_LABELS).map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </Select>
            ) : null}
            {key === "locationLabel" ? (
              <Input
                value={conditions.locationLabel ?? ""}
                onChange={(event) => setCondition("locationLabel", event.target.value)}
                className="min-h-11"
                placeholder="Exact floor, department, or room label"
              />
            ) : null}
            {key === "requestFormId" ? (
              <Select
                value={conditions.requestFormId ?? ""}
                onChange={(event) => setCondition("requestFormId", event.target.value)}
                className="min-h-11"
              >
                <option value="">Any request form</option>
                {catalog.forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </Select>
            ) : null}
            {key === "workTemplateId" ? (
              <Select
                value={conditions.workTemplateId ?? ""}
                onChange={(event) => setCondition("workTemplateId", event.target.value)}
                className="min-h-11"
              >
                <option value="">Any work template</option>
                {catalog.templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </Select>
            ) : null}
          </label>
        ))}
        <Button
          type="button"
          className="min-h-11"
          disabled={busy || !assigneeUserId}
          onClick={() =>
            void run(async () => {
              const response = await fetch("/api/facility/assignment-rules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name,
                  assigneeUserId,
                  conditions,
                  status: "inactive"
                })
              });
              const body = (await response.json()) as { error?: string };
              if (!response.ok) throw new Error(body.error ?? "Could not create rule.");
              setNotice("Rule created as Inactive. Preview it, then Activate.");
              setConditions(emptyConditions());
            })
          }
        >
          Create inactive rule
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-semibold">Preview</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Test sample fields without creating a work order.
        </p>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Sample category</span>
          <Select
            value={sample.category}
            onChange={(event) =>
              setSample((current) => ({
                ...current,
                category: event.target.value as AssignmentWorkFacts["category"]
              }))
            }
            className="min-h-11"
          >
            {WORK_ORDER_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {WORK_ORDER_CATEGORY_LABELS[value]}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Sample priority</span>
          <Select
            value={sample.priority}
            onChange={(event) =>
              setSample((current) => ({
                ...current,
                priority: event.target.value as AssignmentWorkFacts["priority"]
              }))
            }
            className="min-h-11"
          >
            {WORK_ORDER_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {WORK_ORDER_PRIORITY_LABELS[value]}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Sample origin</span>
          <Select
            value={sample.originSource ?? ""}
            onChange={(event) =>
              setSample((current) => ({
                ...current,
                originSource: event.target.value as AssignmentWorkFacts["originSource"]
              }))
            }
            className="min-h-11"
          >
            {Object.entries(ORIGIN_SOURCE_LABELS).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </Select>
        </label>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const response = await fetch("/api/facility/assignment-rules/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sample)
              });
              const body = (await response.json()) as {
                error?: string;
                preview?: { summary?: string; assigneeLabel?: string };
              };
              if (!response.ok) throw new Error(body.error ?? "Could not preview.");
              setPreview(body.preview?.summary ?? "No matching rule.");
              setNotice("Preview updated. No work order was created.");
            })
          }
        >
          Test sample work
        </Button>
        {preview ? <Alert variant="info">{preview}</Alert> : null}
      </section>

      <section className="space-y-3 rounded-xl border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-semibold">Recent routing</h2>
        {(catalog.evaluations ?? []).length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Routing history appears after work is created.
          </p>
        ) : (
          <ul className="space-y-2">
            {(catalog.evaluations ?? []).slice(0, 12).map((row) => (
              <li key={row.id} className="text-sm">
                <span className="font-medium">
                  {row.result === "matched"
                    ? "Assigned"
                    : row.result === "invalid_destination"
                      ? "Left unassigned"
                      : "No match"}
                </span>
                {" — "}
                {row.reason}
              </li>
            ))}
          </ul>
        )}
      </section>
    </FoPageChrome>
  );
}
