"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  WORK_ORDER_CATEGORIES,
  WORK_ORDER_CATEGORY_LABELS,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_PRIORITY_LABELS,
  WORK_TEMPLATE_ITEM_TYPES,
  type WorkTemplateItemType
} from "@mpa/shared";
import { Alert, Button, Input, Select } from "@mpa/ui";
import { FoPageChrome } from "../shell/fo-workspace";

type TemplateRow = {
  id: string;
  name: string;
  status: string;
  current_version_id: string | null;
};

type DraftItem = {
  sortOrder: number;
  type: WorkTemplateItemType;
  label: string;
  required: boolean;
};

export function FacilityWorkTemplatesPage() {
  const startCreate = useSearchParams().get("new") === "1";
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [name, setName] = useState("Quarterly HVAC Inspection");
  const [defaultTitle, setDefaultTitle] = useState("Quarterly HVAC Inspection");
  const [category, setCategory] = useState<(typeof WORK_ORDER_CATEGORIES)[number]>("hvac");
  const [priority, setPriority] = useState<(typeof WORK_ORDER_PRIORITIES)[number]>("normal");
  const [duration, setDuration] = useState("90");
  const [requirePhoto, setRequirePhoto] = useState(true);
  const [items, setItems] = useState<DraftItem[]>([
    { sortOrder: 0, type: "checkbox", label: "Inspect filter", required: true },
    { sortOrder: 1, type: "checkbox", label: "Inspect belt", required: true },
    { sortOrder: 2, type: "number", label: "Supply temperature", required: true },
    { sortOrder: 3, type: "number", label: "Return temperature", required: true },
    { sortOrder: 4, type: "text", label: "Technician notes", required: false },
    { sortOrder: 5, type: "photo", label: "Completion photo", required: true }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const response = await fetch("/api/facility/work-templates");
    const body = (await response.json()) as { templates?: TemplateRow[]; error?: string };
    if (!response.ok) throw new Error(body.error ?? "Could not load templates.");
    setTemplates(body.templates ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/facility/work-templates");
        const body = (await response.json()) as { templates?: TemplateRow[]; error?: string };
        if (cancelled) return;
        if (!response.ok) throw new Error(body.error ?? "Could not load templates.");
        setTemplates(body.templates ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load templates.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createTemplate() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/facility/work-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          defaultTitle,
          category,
          priority,
          expectedDurationMinutes: duration ? Number(duration) : null,
          requireCompletionPhoto: requirePhoto,
          items,
          publish: true
        })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Could not create template.");
      setNotice("Template published.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FoPageChrome
      crumbs={[
        { href: "/facility/mission-control", label: "Mission Control" },
        { href: "/facility/operations", label: "Operations" },
        { label: "Work templates" }
      ]}
      title="Work templates"
      description="Reusable checklists for facility work orders."
    >
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <section id="create-template" className="space-y-3 rounded-xl border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h2 className="font-semibold">Create template</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Template name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus={startCreate} />
          </label>
          <label className="space-y-1 text-sm">
            <span>Default work-order title</span>
            <Input value={defaultTitle} onChange={(e) => setDefaultTitle(e.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span>Category</span>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof WORK_ORDER_CATEGORIES)[number])}
            >
              {WORK_ORDER_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {WORK_ORDER_CATEGORY_LABELS[value]}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Priority</span>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as (typeof WORK_ORDER_PRIORITIES)[number])}
            >
              {WORK_ORDER_PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {WORK_ORDER_PRIORITY_LABELS[value]}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Expected duration (minutes)</span>
            <Input value={duration} onChange={(e) => setDuration(e.target.value)} type="number" />
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requirePhoto}
              onChange={(e) => setRequirePhoto(e.target.checked)}
            />
            Require completion photo on work order
          </label>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Checklist items</h3>
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-md border border-[var(--mpa-color-border-subtle)] p-3 md:grid-cols-4">
              <Input
                value={item.label}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((row, i) => (i === index ? { ...row, label: e.target.value } : row))
                  )
                }
                placeholder="Label"
              />
              <Select
                value={item.type}
                onChange={(e) =>
                  setItems((prev) =>
                    prev.map((row, i) =>
                      i === index
                        ? { ...row, type: e.target.value as WorkTemplateItemType }
                        : row
                    )
                  )
                }
              >
                {WORK_TEMPLATE_ITEM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.required}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((row, i) =>
                        i === index ? { ...row, required: e.target.checked } : row
                      )
                    )
                  }
                />
                Required
              </label>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                {
                  sortOrder: prev.length,
                  type: "checkbox",
                  label: "New step",
                  required: false
                }
              ])
            }
          >
            Add item
          </Button>
        </div>

        <Button type="button" disabled={busy} onClick={() => void createTemplate()}>
          Publish template
        </Button>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Existing templates</h2>
        {templates.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            No templates yet. Publish one to reuse on facility work orders.
          </p>
        ) : (
          <ul className="space-y-2">
            {templates.map((template) => (
              <li
                key={template.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium">{template.name}</span> · {template.status}
              </li>
            ))}
          </ul>
        )}
      </section>
    </FoPageChrome>
  );
}
