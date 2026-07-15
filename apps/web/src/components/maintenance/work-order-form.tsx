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
  initialTenantId
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
}) {
  const router = useRouter();
  const [values, setValues] = useState<WorkOrderFormValues>(() =>
    workOrder
      ? {
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
        }
      : {
          ...DEFAULT_VALUES,
          propertyId:
            (initialPropertyId && properties.some((option) => option.id === initialPropertyId)
              ? initialPropertyId
              : null) ??
            properties[0]?.id ??
            "",
          unitId:
            initialUnitId && units.some((option) => option.id === initialUnitId) ? initialUnitId : "",
          tenantId:
            initialTenantId && tenants.some((option) => option.id === initialTenantId) ? initialTenantId : ""
        }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    if (!values.propertyId || !values.title.trim()) {
      setError("Property and title are required.");
      return;
    }

    setSubmitting(true);
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
      const failure = (await response.json()) as { error?: string };
      setError(failure.error ?? "Unable to save work order.");
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

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-3">
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
          <Select
            aria-label="Unit"
            value={values.unitId}
            onChange={(event) => setValues((current) => ({ ...current, unitId: event.target.value, tenantId: "" }))}
          >
            <option value="">Optional unit</option>
            {availableUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                Unit {unit.unitNumber}
              </option>
            ))}
          </Select>
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
        </div>

        <Input
          aria-label="Title"
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          required
        />
        <Textarea
          aria-label="Description"
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          rows={3}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Select
            aria-label="Category"
            value={values.category}
            onChange={(event) =>
              setValues((current) => ({ ...current, category: event.target.value as WorkOrderRecord["category"] }))
            }
          >
            {MAINTENANCE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {toMaintenanceCategoryLabel(category)}
              </option>
            ))}
          </Select>
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
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            aria-label="Due date"
            type="date"
            value={values.dueDate}
            onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))}
          />
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
        </div>

        <Textarea
          aria-label="Internal notes"
          value={values.internalNotes}
          onChange={(event) => setValues((current) => ({ ...current, internalNotes: event.target.value }))}
          rows={3}
        />
        <Textarea
          aria-label="Tenant notes"
          value={values.tenantNotes}
          onChange={(event) => setValues((current) => ({ ...current, tenantNotes: event.target.value }))}
          rows={2}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            aria-label="Photo placeholder"
            value={values.photoPlaceholder}
            onChange={(event) => setValues((current) => ({ ...current, photoPlaceholder: event.target.value }))}
            placeholder="Future photo attachments module"
          />
          <Input
            aria-label="Document placeholder"
            value={values.documentPlaceholder}
            onChange={(event) => setValues((current) => ({ ...current, documentPlaceholder: event.target.value }))}
            placeholder="Future documents module"
          />
          <Input
            aria-label="Recurring maintenance placeholder"
            value={values.recurringMaintenancePlaceholder}
            onChange={(event) =>
              setValues((current) => ({ ...current, recurringMaintenancePlaceholder: event.target.value }))
            }
          />
          <Input
            aria-label="Preventive maintenance placeholder"
            value={values.preventiveMaintenancePlaceholder}
            onChange={(event) =>
              setValues((current) => ({ ...current, preventiveMaintenancePlaceholder: event.target.value }))
            }
          />
        </div>

        <div className="rounded-md border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3 text-sm text-[var(--mpa-color-text-secondary)]">
          Vendor assignment is reserved for Phase 7. Internal staff assignment is active now.
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : mode === "create" ? "Create Work Order" : "Save Changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
