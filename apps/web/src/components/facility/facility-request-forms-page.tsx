"use client";

import { useEffect, useState } from "react";
import {
  defaultStandardFieldCatalog,
  intakeChannelLabel,
  STANDARD_FIELD_DEFAULT_LABELS,
  type FacilityRequestAccessPolicy,
  type FacilityRequestContextKind,
  type FacilityRequestCustomType,
  type FacilityRequestFieldDef,
  type FacilityRequestFieldRequirement
} from "@mpa/shared";
import { Alert, Badge, Button, Input, Textarea } from "@mpa/ui";
import { FoPageChrome } from "../shell/fo-workspace";

type FormRow = {
  id: string;
  name: string;
  status: string;
  access_policy: FacilityRequestAccessPolicy;
};

type IntakeRow = {
  id: string;
  public_token_prefix: string;
  context_kind: string;
  status: string;
};

type Building = { id: string; name: string };

const CUSTOM_TYPES: FacilityRequestCustomType[] = [
  "short_text",
  "long_text",
  "select",
  "yes_no",
  "number",
  "date"
];

export function FacilityRequestFormsPage() {
  const [forms, setForms] = useState<FormRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("Furniture / Maintenance Request");
  const [instructions, setInstructions] = useState("Tell us what is broken and add a photo if you can.");
  const [accessPolicy, setAccessPolicy] = useState<FacilityRequestAccessPolicy>("contact_required");
  const [fields, setFields] = useState<FacilityRequestFieldDef[]>(defaultStandardFieldCatalog());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [contextKind, setContextKind] = useState<FacilityRequestContextKind>("floor");
  const [floorContext, setFloorContext] = useState("Floor 3");
  const [departmentContext, setDepartmentContext] = useState("");
  const [roomContext, setRoomContext] = useState("");
  const [assetContext, setAssetContext] = useState("");
  const [buildingId, setBuildingId] = useState("");
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [intakes, setIntakes] = useState<IntakeRow[]>([]);
  const [customType, setCustomType] = useState<FacilityRequestCustomType>("short_text");

  const visible = fields.filter((field) => field.requirement !== "hidden").sort((a, b) => a.order - b.order);

  async function refresh() {
    const response = await fetch("/api/facility/request-forms");
    const body = (await response.json()) as { forms?: FormRow[]; error?: string };
    if (!response.ok) throw new Error(body.error ?? "Could not load request forms.");
    setForms(body.forms ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/facility/request-forms")
      .then(async (response) => {
        const body = (await response.json()) as { forms?: FormRow[]; error?: string };
        if (cancelled) return;
        if (!response.ok) throw new Error(body.error ?? "Could not load request forms.");
        setForms(body.forms ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load.");
      });
    void fetch("/api/facility/operations")
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const body = (await response.json()) as { properties?: Building[] };
        setBuildings((body.properties ?? []).map((row) => ({ id: row.id, name: row.name })));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadForm(formId: string) {
    setSelectedId(formId);
    setLinkUrl(null);
    setQrSvg(null);
    const response = await fetch(`/api/facility/request-forms/${formId}`);
    const body = (await response.json()) as {
      form?: { name: string; instructions: string | null; access_policy: FacilityRequestAccessPolicy };
      version?: { field_snapshot?: { fields?: FacilityRequestFieldDef[] } };
      error?: string;
    };
    if (!response.ok || !body.form) {
      setError(body.error ?? "Could not load that form.");
      return;
    }
    setName(body.form.name);
    setInstructions(body.form.instructions ?? "");
    setAccessPolicy(body.form.access_policy);
    if (body.version?.field_snapshot?.fields) {
      setFields(body.version.field_snapshot.fields);
    }
    const intakeResponse = await fetch(`/api/facility/request-forms/${formId}/intakes`);
    const intakeBody = (await intakeResponse.json()) as { intakes?: IntakeRow[] };
    setIntakes(intakeBody.intakes ?? []);
  }

  async function persistDraft(formId?: string) {
    const target = formId ?? selectedId;
    if (!target) {
      const response = await fetch("/api/facility/request-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, instructions, accessPolicy, fields })
      });
      const body = (await response.json()) as { form?: { id: string }; error?: string };
      if (!response.ok || !body.form) {
        throw new Error(body.error ?? "Could not create the form.");
      }
      setSelectedId(body.form.id);
      return body.form.id;
    }
    const response = await fetch(`/api/facility/request-forms/${target}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, instructions, accessPolicy, fields })
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(body.error ?? "Could not save the draft.");
    return target;
  }

  async function createForm() {
    setError(null);
    try {
      const id = await persistDraft();
      setNotice("Draft saved. Preview, then publish.");
      await refresh();
      if (id) await loadForm(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    }
  }

  async function publish() {
    setError(null);
    try {
      const formId = await persistDraft();
      const response = await fetch(`/api/facility/request-forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not publish.");
        return;
      }
      setNotice("Published. You can create a share link or QR.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish.");
    }
  }

  async function deactivate() {
    if (!selectedId) return;
    const response = await fetch(`/api/facility/request-forms/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deactivate" })
    });
    if (!response.ok) {
      setError("Could not deactivate.");
      return;
    }
    setNotice("Form deactivated. Existing QR and share links stop accepting submissions.");
    await refresh();
  }

  async function createLink() {
    if (!selectedId) {
      setError("Publish a form first.");
      return;
    }
    const building = buildings.find((row) => row.id === buildingId);
    const response = await fetch(`/api/facility/request-forms/${selectedId}/intakes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contextKind,
        context: {
          ...(building ? { propertyId: building.id, propertyLabel: building.name } : {}),
          ...(floorContext.trim() ? { floorLabel: floorContext.trim() } : {}),
          ...(departmentContext.trim() ? { departmentLabel: departmentContext.trim() } : {}),
          ...(roomContext.trim() ? { roomLabel: roomContext.trim() } : {}),
          ...(assetContext.trim() ? { facilityAssetLabel: assetContext.trim() } : {})
        }
      })
    });
    const body = (await response.json()) as { linkUrl?: string; qrSvg?: string; error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not create the link.");
      return;
    }
    setLinkUrl(body.linkUrl ?? null);
    setQrSvg(body.qrSvg ?? null);
    setNotice("Share link and QR are ready. They stay valid if you later edit the form.");
    await loadForm(selectedId);
  }

  async function revoke(intakeId: string) {
    const response = await fetch(`/api/facility/request-forms/${selectedId}/intakes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", intakeId })
    });
    if (!response.ok) {
      setError("Could not revoke that link.");
      return;
    }
    setNotice("That QR / share link can no longer accept requests.");
    await loadForm(selectedId);
  }

  function updateField(key: string, patch: Partial<FacilityRequestFieldDef>) {
    setFields((current) => current.map((field) => (field.key === key ? { ...field, ...patch } : field)));
  }

  function addCustomField() {
    const nextOrder = fields.reduce((max, field) => Math.max(max, field.order), 0) + 10;
    const key = `custom_${Date.now()}`;
    setFields((current) => [
      ...current,
      {
        key,
        kind: "custom",
        customType,
        requirement: "required",
        label: customType === "short_text" ? "Zone" : "Custom field",
        order: nextOrder,
        ...(customType === "select" ? { options: ["Option A", "Option B"] } : {})
      }
    ]);
  }

  return (
    <FoPageChrome
      crumbs={[
        { href: "/facility/mission-control", label: "Facility Mission Control" },
        { label: "Request Forms" }
      ]}
      title="Request Forms"
      description="Create the questions people answer when they scan a QR or open a share link. The same form powers both."
    >
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <section className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Forms
          </p>
          {forms.map((form) => (
            <button
              key={form.id}
              type="button"
              className="flex min-h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm"
              onClick={() => void loadForm(form.id)}
            >
              <span>{form.name}</span>
              <Badge variant={form.status === "active" ? "success" : "neutral"}>{form.status}</Badge>
            </button>
          ))}
          {forms.length === 0 ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">No forms yet.</p> : null}
        </aside>

        <div className="space-y-4">
          <div className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <label className="grid gap-1 text-sm">
              Name
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              Instructions
              <Textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              Who can submit
              <select
                className="min-h-11 rounded-md border border-[var(--mpa-color-border-default)] px-3"
                value={accessPolicy}
                onChange={(event) => setAccessPolicy(event.target.value as FacilityRequestAccessPolicy)}
              >
                <option value="contact_required">Contact required — no M.P.A. account needed</option>
                <option value="authenticated_only">Signed-in users only</option>
              </select>
            </label>
          </div>

          <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <p className="text-sm font-semibold">Fields</p>
            {fields.map((field) => (
              <div key={field.key} className="grid gap-2 border-b border-[var(--mpa-color-border-default)] py-3 last:border-b-0">
                <div className="grid gap-2 md:grid-cols-[1fr_8rem_8rem]">
                  <label className="text-xs">
                    Label
                    <Input value={field.label} onChange={(event) => updateField(field.key, { label: event.target.value })} />
                  </label>
                  <label className="text-xs">
                    Required
                    <select
                      className="mt-1 min-h-11 w-full rounded-md border px-2"
                      value={field.requirement}
                      onChange={(event) =>
                        updateField(field.key, { requirement: event.target.value as FacilityRequestFieldRequirement })
                      }
                    >
                      <option value="required">Required</option>
                      <option value="optional">Optional</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </label>
                  <label className="text-xs">
                    Order
                    <Input
                      type="number"
                      value={field.order}
                      onChange={(event) => updateField(field.key, { order: Number(event.target.value) })}
                    />
                  </label>
                </div>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {field.standardKey ? STANDARD_FIELD_DEFAULT_LABELS[field.standardKey] : `Custom · ${field.customType}`}
                </p>
                <label className="text-xs">
                  Helper text
                  <Input
                    value={field.helperText ?? ""}
                    onChange={(event) => updateField(field.key, { helperText: event.target.value })}
                  />
                </label>
                {field.customType === "select" ? (
                  <label className="text-xs">
                    Options (comma separated)
                    <Input
                      value={(field.options ?? []).join(", ")}
                      onChange={(event) =>
                        updateField(field.key, {
                          options: event.target.value.split(",").map((option) => option.trim()).filter(Boolean)
                        })
                      }
                    />
                  </label>
                ) : null}
              </div>
            ))}
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs">
                Add custom field
                <select
                  className="mt-1 min-h-11 rounded-md border px-2"
                  value={customType}
                  onChange={(event) => setCustomType(event.target.value as FacilityRequestCustomType)}
                >
                  {CUSTOM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="button" variant="secondary" onClick={addCustomField}>
                Add field
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void createForm()}>
              Save draft
            </Button>
            <Button type="button" variant="secondary" onClick={() => setPreview((value) => !value)}>
              Preview form
            </Button>
            <Button type="button" onClick={() => void publish()}>
              Publish
            </Button>
            <Button type="button" variant="secondary" onClick={() => void deactivate()}>
              Deactivate
            </Button>
          </div>

          {preview ? (
            <div className="rounded-md border border-[var(--mpa-color-brand-primary)]/40 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-[var(--mpa-color-brand-primary)]">Preview</p>
              <h2 className="mt-1 font-display text-xl font-semibold">{name}</h2>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{instructions}</p>
              <div className="mt-4 grid gap-3">
                {visible.map((field) => (
                  <label key={field.key} className="grid gap-1 text-sm">
                    {field.label}
                    {field.helperText ? (
                      <span className="text-xs text-[var(--mpa-color-text-secondary)]">{field.helperText}</span>
                    ) : null}
                    <Input
                      value={field.key === "floor" ? floorContext : ""}
                      readOnly={field.key === "floor" && Boolean(floorContext)}
                      aria-readonly={field.key === "floor" && Boolean(floorContext)}
                      placeholder={field.placeholder ?? ""}
                    />
                  </label>
                ))}
                <Button type="button" className="min-h-12">
                  Submit
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
            <p className="text-sm font-semibold">Share link / QR code</p>
            <label className="grid gap-1 text-sm">
              Context
              <select
                className="min-h-11 rounded-md border px-3"
                value={contextKind}
                onChange={(event) => setContextKind(event.target.value as FacilityRequestContextKind)}
              >
                <option value="general">General</option>
                <option value="building">Building</option>
                <option value="floor">Floor</option>
                <option value="department">Department</option>
                <option value="room">Room</option>
                <option value="asset">Asset</option>
              </select>
            </label>
            {buildings.length > 0 ? (
              <label className="grid gap-1 text-sm">
                Building
                <select
                  className="min-h-11 rounded-md border px-3"
                  value={buildingId}
                  onChange={(event) => setBuildingId(event.target.value)}
                >
                  <option value="">None locked</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="grid gap-1 text-sm">
              Floor label
              <Input value={floorContext} onChange={(event) => setFloorContext(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              Department label
              <Input value={departmentContext} onChange={(event) => setDepartmentContext(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              Room label
              <Input value={roomContext} onChange={(event) => setRoomContext(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              Asset label
              <Input value={assetContext} onChange={(event) => setAssetContext(event.target.value)} />
            </label>
            <Button type="button" onClick={() => void createLink()}>
              Generate QR and copy link
            </Button>
            {linkUrl ? (
              <p className="break-all text-sm">
                Share link: <a href={linkUrl}>{linkUrl}</a>
              </p>
            ) : null}
            {qrSvg ? <div aria-label="QR code" dangerouslySetInnerHTML={{ __html: qrSvg }} /> : null}
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              {intakeChannelLabel("qr")} and {intakeChannelLabel("public_link")} use the same published form.
            </p>
            {intakes.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {intakes.map((intake) => (
                  <li key={intake.id} className="flex items-center justify-between gap-2">
                    <span>
                      {intake.context_kind} · {intake.public_token_prefix}… · {intake.status}
                    </span>
                    {intake.status === "active" ? (
                      <Button type="button" variant="secondary" onClick={() => void revoke(intake.id)}>
                        Revoke
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>
    </FoPageChrome>
  );
}
