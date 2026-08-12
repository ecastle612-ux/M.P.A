import {
  WORK_ORDER_CATEGORY_LABELS,
  WORK_ORDER_PRIORITY_LABELS,
  WORK_ORDER_STATUS_LABELS,
  type WorkOrderCategory,
  type WorkOrderPriority,
  type WorkOrderStatus
} from "@mpa/shared";

export type FieldWorkOrderContext = {
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  category?: string | null;
  propertyName?: string | null;
  unitLabel?: string | null;
  assetLabel?: string | null;
  assigneeType?: string | null;
  technicianLabel?: string | null;
  vendorName?: string | null;
  submittedAt?: string | null;
  dueAt?: string | null;
};

export type FieldPrimaryAction = "start" | "progress" | "complete" | null;

/** Next lifecycle action a field worker should take first. */
export function fieldPrimaryAction(status: WorkOrderStatus): FieldPrimaryAction {
  if (["closed", "cancelled", "completed"].includes(status)) {
    return null;
  }
  if (status === "in_progress") {
    return "complete";
  }
  if (["submitted", "triaged", "assigned"].includes(status)) {
    return "start";
  }
  return "progress";
}

export function fieldActionButtonClasses(action: "start" | "progress" | "complete" | "cancel", primary: FieldPrimaryAction) {
  const base = "min-h-11";
  if (action === "cancel") {
    return `${base} w-full sm:w-auto`;
  }
  if (primary === action) {
    return `${base} w-full sm:w-auto`;
  }
  return `${base} w-full sm:w-auto`;
}

export function fieldActionVariant(
  action: "start" | "progress" | "complete" | "cancel",
  primary: FieldPrimaryAction
): "primary" | "secondary" | "danger" {
  if (action === "cancel") {
    return "secondary";
  }
  if (primary === action) {
    return "primary";
  }
  return "secondary";
}

export function fieldAssignmentLabel(input: {
  assigneeType?: string | null;
  technicianLabel?: string | null;
  vendorName?: string | null;
}): string {
  if (input.assigneeType === "vendor") {
    return input.vendorName ? `Vendor · ${input.vendorName}` : "Vendor assigned";
  }
  if (input.assigneeType === "technician") {
    return input.technicianLabel ? `Technician · ${input.technicianLabel}` : "Technician assigned";
  }
  return "Unassigned";
}

export function fieldLocationLabel(input: {
  propertyName?: string | null;
  unitLabel?: string | null;
  assetLabel?: string | null;
}): string {
  const parts = [
    input.propertyName?.trim() || "Building",
    input.unitLabel ? `Unit ${input.unitLabel}` : null,
    input.assetLabel?.trim() || null
  ].filter(Boolean);
  return parts.join(" · ");
}

export function fieldWorkOrderScanLines(input: FieldWorkOrderContext): Array<{
  id: string;
  label: string;
  value: string;
}> {
  const lines = [
    {
      id: "location",
      label: "Where",
      value: fieldLocationLabel({
        propertyName: input.propertyName,
        unitLabel: input.unitLabel,
        assetLabel: input.assetLabel
      })
    },
    {
      id: "status",
      label: "Status",
      value: WORK_ORDER_STATUS_LABELS[input.status]
    },
    {
      id: "priority",
      label: "Priority",
      value: WORK_ORDER_PRIORITY_LABELS[input.priority]
    },
    {
      id: "assignment",
      label: "Assigned",
      value: fieldAssignmentLabel({
        assigneeType: input.assigneeType,
        technicianLabel: input.technicianLabel,
        vendorName: input.vendorName
      })
    }
  ];

  if (input.category) {
    lines.push({
      id: "category",
      label: "Type",
      value:
        WORK_ORDER_CATEGORY_LABELS[input.category as WorkOrderCategory] ?? input.category
    });
  }
  if (input.submittedAt) {
    lines.push({
      id: "submitted",
      label: "Created",
      value: new Date(input.submittedAt).toLocaleString()
    });
  }
  if (input.dueAt) {
    lines.push({
      id: "due",
      label: "Due",
      value: new Date(input.dueAt).toLocaleString()
    });
  }

  return lines;
}

/** Progress note is for start/progress/complete; cancel uses its own optional reason. */
export function resolveProgressNote(note: string, action: "start" | "progress" | "complete"): string {
  const trimmed = note.trim();
  if (trimmed) {
    return trimmed;
  }
  if (action === "start") {
    return "Work started.";
  }
  if (action === "complete") {
    return "Work completed.";
  }
  return "Progress update.";
}

export function resolveCancelNote(
  cancelNote: string,
  fallback = "Cancelled from Facility Operations"
): string {
  const trimmed = cancelNote.trim();
  return trimmed || fallback;
}

export function vendorPortalScopeCopy(): string {
  return "Start, update, and complete work orders assigned to your vendor account. Documents and invoices are not included in this work view.";
}
