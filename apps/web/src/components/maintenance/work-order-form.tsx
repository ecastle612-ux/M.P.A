"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@mpa/ui";
import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  toMaintenanceCategoryLabel,
  toMaintenancePriorityLabel,
  toMaintenanceStatusLabel,
  type WorkOrderRecord
} from "../../lib/maintenance/contracts";
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "../../lib/media/constants";
import { readApiError } from "../../lib/api/client-error";
import { collectIssues, validateRequired, type ValidationIssue } from "../../lib/trust/validation";
import { suggestMaintenanceCategoryFromTitle } from "../../lib/workflow/category-suggest";
import { getWorkspaceMemory, rememberPropertyContext, resolveContextId } from "../../lib/workflow/workspace-memory";
import { MediaUpload } from "../media/media-upload";
import { ApiErrorAlert, ValidationAlert } from "../trust/validation-alert";
import { OperationalStatus } from "../trust/operational-status";
import { useSubmissionGuard } from "../../hooks/use-submission-guard";

type WorkOrderFormValues = {
  propertyId: string;
  unitId: string;
  tenantId: string;
  title: string;
  description: string;
  category: WorkOrderRecord["category"];
  priority: WorkOrderRecord["priority"];
  status: WorkOrderRecord["status"];
  dueDate: string;
  assignedToUserId: string;
  internalNotes: string;
  tenantNotes: string;
  photoPlaceholder: string;
  documentPlaceholder: string;
  recurringMaintenancePlaceholder: string;
  preventiveMaintenancePlaceholder: string;
};

const DEFAULT_VALUES: WorkOrderFormValues = {
  propertyId: "",
  unitId: "",
  tenantId: "",
  title: "",
  description: "",
  category: "general",
  priority: "medium",
  status: "submitted",
  dueDate: "",
  assignedToUserId: "",
  internalNotes: "",
  tenantNotes: "",
  photoPlaceholder: "",
  documentPlaceholder: "",
  recurringMaintenancePlaceholder: "",
  preventiveMaintenancePlaceholder: ""
};

export function WorkOrderForm({
  mode,
  workOrder,
  properties,
  units,
  tenants,
  assignees,
  initialPropertyId,
  initialUnitId,
  initialTenantId,
  initialTitle,
  organizationId
}: {
  mode: "create" | "edit";
  workOrder?: WorkOrderRecord | null;
  properties: Array<{ id: string; name: string }>;
  units: Array<{ id: string; propertyId: string; unitNumber: string }>;
  tenants: Array<{ id: string; propertyId: string | null; unitId: string | null; name: string }>;
  assignees: Array<{ userId: string; label: string }>;
  initialPropertyId?: string | null;
  initialUnitId?: string | null;
  initialTenantId?: string | null;
  initialTitle?: string | null;
  organizationId?: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<WorkOrderFormValues>(() => {
    if (workOrder) {
      return {
        propertyId: workOrder.propertyId,
        unitId: workOrder.unitId ?? "",
        tenantId: workOrder.tenantId ?? "",
        title: workOrder.title,
        description: workOrder.description ?? "",
        category: workOrder.category,
        priority: workOrder.priority,
        status: workOrder.status,
        dueDate: workOrder.dueDate ?? "",
        assignedToUserId: workOrder.assignedToUserId ?? "",
        internalNotes: workOrder.internalNotes ?? "",
        tenantNotes: workOrder.tenantNotes ?? "",
        photoPlaceholder: workOrder.photoPlaceholder ?? "",
        documentPlaceholder: workOrder.documentPlaceholder ?? "",
        recurringMaintenancePlaceholder: workOrder.recurringMaintenancePlaceholder ?? "",
        preventiveMaintenancePlaceholder: workOrder.preventiveMaintenancePlaceholder ?? ""
      };
    }
    const memory = typeof window !== "undefined" ? getWorkspaceMemory() : null;
    const propertyIds = properties.map((p) => p.id);
    const propertyId = resolveContextId(initialPropertyId, memory?.propertyId, propertyIds);
    const unitIds = units.filter((u) => u.propertyId === propertyId).map((u) => u.id);
    const unitId = resolveContextId(initialUnitId, memory?.unitId, unitIds, false);
    const tenantForUnit = unitId
      ? tenants.find((t) => t.unitId === unitId && (!t.propertyId || t.propertyId === propertyId))
      : null;
    const tenantIds = tenants
      .filter((t) => (!t.propertyId || t.propertyId === propertyId) && (!unitId || !t.unitId || t.unitId === unitId))
      .map((t) => t.id);
    const tenantId = resolveContextId(
      initialTenantId ?? tenantForUnit?.id,
      memory?.tenantId,
      tenantIds,
      Boolean(tenantForUnit)
    );
    const title = initialTitle?.trim() ?? "";
    const suggested = title ? suggestMaintenanceCategoryFromTitle(title) : null;
    return {
      ...DEFAULT_VALUES,
      propertyId,
      unitId,
      tenantId: tenantId || tenantForUnit?.id || "",
      title,
      category: suggested ?? DEFAULT_VALUES.category
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const { busy, run } = useSubmissionGuard();
  const [categoryHint, setCategoryHint] = useState<string | null>(() => {
    const title = initialTitle?.trim() ?? "";
    const suggested = title ? suggestMaintenanceCategoryFromTitle(title) : null;
    return suggested ? `Suggested category: ${toMaintenanceCategoryLabel(suggested)}` : null;
  });

  const availableUnits = useMemo(
    () => units.filter((unit) => unit.propertyId === values.propertyId),
    [units, values.propertyId]
  );
  const availableTenants = useMemo(
    () =>
      tenants.filter((tenant) => {
        if (tenant.propertyId && tenant.propertyId !== values.propertyId) return false;
        if (values.unitId && tenant.unitId && tenant.unitId !== values.unitId) return false;
        return true;
      }),
    [tenants, values.propertyId, values.unitId]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssues([]);
    setApiError(null);

    const nextIssues = collectIssues(
      validateRequired(values.propertyId, "Property"),
      validateRequired(values.title, "Title")
    );
    if (nextIssues.length > 0) {
      setIssues(nextIssues);
      return;
    }

    const payload = {
      propertyId: values.propertyId,
      unitId: values.unitId || null,
      tenantId: values.tenantId || null,
      title: values.title.trim(),
      description: values.description.trim() || null,
      category: values.category,
      priority: values.priority,
      status: values.status,
      dueDate: values.dueDate || null,
      assignedToUserId: values.assignedToUserId || null,
      internalNotes: values.internalNotes.trim() || null,
      tenantNotes: values.tenantNotes.trim() || null,
      photoPlaceholder: values.photoPlaceholder.trim() || null,
      documentPlaceholder: values.documentPlaceholder.trim() || null,
      recurringMaintenancePlaceholder: values.recurringMaintenancePlaceholder.trim() || null,
      preventiveMaintenancePlaceholder: values.preventiveMaintenancePlaceholder.trim() || null
    };

    await run(`work-order:${mode}:${values.propertyId}:${values.title}`, async () => {
      setSubmitting(true);
      rememberPropertyContext({
        propertyId: values.propertyId,
        unitId: values.unitId || null,
        tenantId: values.tenantId || null
      });
      const response = await fetch(
        mode === "create" ? "/api/maintenance" : `/api/maintenance/${workOrder?.id ?? ""}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mode === "create" ? payload : { action: "update", ...payload })
        }
      );
      setSubmitting(false);

      if (!response.ok) {
        const failure = await response.json().catch(() => ({}));
        setApiError(readApiError(failure, "Unable to save work order. Check property and title, then retry."));
        return;
      }

      const result = (await response.json()) as { workOrder?: { id: string } };
      if (mode === "create" && result.workOrder?.id) {
        router.push(`/maintenance/${result.workOrder.id}?from=work-order-created`);
        router.refresh();
        return;
      }

      router.push(`/maintenance/${workOrder?.id ?? ""}`);
      router.refresh();
    });
  }

  return (
    <Card className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          {mode === "create" ? "Create Work Order" : "Edit Work Order"}
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Property manager workflow — link property, unit, and tenant context before assignment.
        </p>
      </div>

      <ValidationAlert issues={issues} />
      {apiError ? <ApiErrorAlert message={apiError} /> : null}
      {submitting || busy ? <OperationalStatus message="Saving work order…" /> : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Property</span>
            <Select
              aria-label="Property"
              value={values.propertyId}
              onChange={(event) =>
                setValues((current) => ({ ...current, propertyId: event.target.value, unitId: "", tenantId: "" }))
              }
              required
            >
              <option value="">Select property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Unit</span>
            <Select
              aria-label="Unit"
              value={values.unitId}
              onChange={(event) => {
                const nextUnitId = event.target.value;
                const occupied =
                  mode === "create"
                    ? tenants.find(
                        (tenant) =>
                          tenant.unitId === nextUnitId &&
                          (!tenant.propertyId || tenant.propertyId === values.propertyId)
                      )
                    : null;
                setValues((current) => ({
                  ...current,
                  unitId: nextUnitId,
                  tenantId: occupied?.id ?? ""
                }));
              }}
            >
              <option value="">Optional unit</option>
              {availableUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unit {unit.unitNumber}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Tenant</span>
            <Select
              aria-label="Tenant"
              value={values.tenantId}
              onChange={(event) => setValues((current) => ({ ...current, tenantId: event.target.value }))}
            >
              <option value="">Optional tenant</option>
              {availableTenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Title</span>
          <Input
            aria-label="Title"
            value={values.title}
            onChange={(event) => {
              const title = event.target.value;
              const suggested = mode === "create" ? suggestMaintenanceCategoryFromTitle(title) : null;
              setValues((current) => ({
                ...current,
                title,
                category:
                  suggested && (current.category === "general" || current.category === suggested)
                    ? suggested
                    : current.category
              }));
              setCategoryHint(
                suggested ? `Suggested category: ${toMaintenanceCategoryLabel(suggested)}` : null
              );
            }}
            required
          />
          {categoryHint ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">{categoryHint}</p>
          ) : null}
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Description</span>
          <Textarea
            aria-label="Description"
            value={values.description}
            onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
            rows={3}
          />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Category</span>
            <Select
              aria-label="Category"
              value={values.category}
              onChange={(event) => {
                setCategoryHint(null);
                setValues((current) => ({
                  ...current,
                  category: event.target.value as WorkOrderRecord["category"]
                }));
              }}
            >
              {MAINTENANCE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {toMaintenanceCategoryLabel(category)}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Priority</span>
            <Select
              aria-label="Priority"
              value={values.priority}
              onChange={(event) =>
                setValues((current) => ({ ...current, priority: event.target.value as WorkOrderRecord["priority"] }))
              }
            >
              {MAINTENANCE_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {toMaintenancePriorityLabel(priority)}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Status</span>
            <Select
              aria-label="Status"
              value={values.status}
              onChange={(event) =>
                setValues((current) => ({ ...current, status: event.target.value as WorkOrderRecord["status"] }))
              }
            >
              {MAINTENANCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {toMaintenanceStatusLabel(status)}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Due date</span>
            <Input
              aria-label="Due date"
              type="date"
              value={values.dueDate}
              onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Assign staff</span>
            <Select
              aria-label="Assign internal staff"
              value={values.assignedToUserId}
              onChange={(event) => setValues((current) => ({ ...current, assignedToUserId: event.target.value }))}
            >
              <option value="">Unassigned</option>
              {assignees.map((assignee) => (
                <option key={assignee.userId} value={assignee.userId}>
                  {assignee.label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Internal notes</span>
          <Textarea
            aria-label="Internal notes"
            value={values.internalNotes}
            onChange={(event) => setValues((current) => ({ ...current, internalNotes: event.target.value }))}
            rows={3}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Tenant notes</span>
          <Textarea
            aria-label="Tenant notes"
            value={values.tenantNotes}
            onChange={(event) => setValues((current) => ({ ...current, tenantNotes: event.target.value }))}
            rows={2}
          />
        </label>

        <MediaUpload
          label="Work order photo"
          value={values.photoPlaceholder.startsWith("media:") ? values.photoPlaceholder.slice(6) : null}
          onChange={(assetId) =>
            setValues((current) => ({
              ...current,
              photoPlaceholder: assetId ? `media:${assetId}` : ""
            }))
          }
          intent={{
            kind: "maintenance_photo",
            organizationId: organizationId ?? workOrder?.organizationId ?? null,
            entityType: "maintenance_work_order",
            ...(workOrder?.id ? { entityId: workOrder.id } : {}),
            imageEditor: "optional",
            capture: true,
            accept: [...IMAGE_MIME_TYPES],
            maxBytes: MAX_IMAGE_BYTES
          }}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            aria-label="Document notes"
            value={values.documentPlaceholder}
            onChange={(event) => setValues((current) => ({ ...current, documentPlaceholder: event.target.value }))}
            placeholder="Document notes (optional)"
          />
          <Input
            aria-label="Recurring maintenance notes"
            value={values.recurringMaintenancePlaceholder}
            onChange={(event) =>
              setValues((current) => ({ ...current, recurringMaintenancePlaceholder: event.target.value }))
            }
            placeholder="Recurring notes (optional)"
          />
        </div>

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap gap-2 border-t border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--mpa-color-bg-surface)]/80 md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <Button type="submit" disabled={submitting || busy} className="min-h-11 min-w-[8.5rem]">
            {submitting || busy ? "Saving…" : mode === "create" ? "Create Work Order" : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() =>
              router.push(mode === "edit" && workOrder?.id ? `/maintenance/${workOrder.id}` : "/maintenance")
            }
            disabled={submitting || busy}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
