"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import type { MaintenanceStatus, WorkOrderRecord } from "../../lib/maintenance/contracts";
import type { VendorAssignmentListItem } from "../../lib/vendor/server";
import { readApiError } from "../../lib/api/client-error";
import { ConfirmActionDialog } from "../trust/confirm-action-dialog";
import { ApiErrorAlert } from "../trust/validation-alert";
import { OperationalStatus } from "../trust/operational-status";
import { useUndoableAction } from "../../hooks/use-undoable-action";

type PrimaryAction = {
  label: string;
  description: string;
  run: () => Promise<void>;
  href?: never;
  confirm?: { title: string; consequence: string; tone?: "default" | "danger"; confirmLabel?: string };
} | {
  label: string;
  description: string;
  href: string;
  run?: never;
  confirm?: never;
};

export function WorkOrderWorkflowPanel({
  workOrderId,
  status,
  priority,
  currentAssignment,
  canUpdate,
  canAssignVendor,
  canArchive,
  tenantId
}: {
  workOrderId: string;
  status: MaintenanceStatus;
  priority: WorkOrderRecord["priority"];
  currentAssignment: VendorAssignmentListItem | null;
  canUpdate: boolean;
  canAssignVendor: boolean;
  canArchive: boolean;
  tenantId: string | null;
}) {
  const router = useRouter();
  const { runWithUndo } = useUndoableAction();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<PrimaryAction & { run: () => Promise<void> } | null>(null);

  async function patchWorkOrder(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/maintenance/${workOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(readApiError(json, "Could not update work order"));
      }
      setMessage("Updated — notifications follow existing maintenance rules.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function archiveWithUndo() {
    setBusy(true);
    setError(null);
    try {
      await runWithUndo({
        key: `wo-archive:${workOrderId}`,
        successTitle: "Work order closed",
        successDescription: "Archived. Undo is available for a few seconds.",
        doAction: async () => {
          const response = await fetch(`/api/maintenance/${workOrderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "archive" })
          });
          const json = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(readApiError(json, "Could not archive work order"));
          }
        },
        undoAction: async () => {
          const response = await fetch(`/api/maintenance/${workOrderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "restore" })
          });
          const json = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(readApiError(json, "Could not restore work order"));
          }
          router.refresh();
        }
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archive failed");
    } finally {
      setBusy(false);
    }
  }

  const assignmentStatus = currentAssignment?.assignmentStatus ?? null;

  const primary = resolvePrimaryAction({
    status,
    assignmentStatus,
    canUpdate,
    canAssignVendor,
    canArchive,
    tenantId,
    workOrderId,
    patchWorkOrder,
    archiveWithUndo,
    onCompleted: () => {
      router.push(`/maintenance/${workOrderId}?from=work-order-completed`);
      router.refresh();
    }
  });

  const secondary = resolveSecondaryActions({
    status,
    canUpdate,
    canAssignVendor,
    canArchive,
    tenantId,
    workOrderId,
    patchWorkOrder,
    archiveWithUndo
  });

  async function activate(action: PrimaryAction) {
    if (action.href || !action.run) return;
    if (action.confirm) {
      setPending(action);
      return;
    }
    await action.run();
  }

  if (!primary && secondary.length === 0) {
    return null;
  }

  return (
    <Card className="space-y-3 border-[var(--mpa-color-brand-primary)]/25 bg-[var(--mpa-color-brand-primary-subtle)]/40">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
          Next workflow step
        </p>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          {priority === "emergency" ? "Emergency priority — resolve the next step now. " : ""}
          Manage the work from here — Edit is only for rare field corrections.
        </p>
      </div>

      {primary ? (
        primary.href ? (
          <Link href={primary.href} className="block w-full sm:w-auto">
            <Button className="w-full sm:w-auto" disabled={busy}>
              {primary.label}
            </Button>
          </Link>
        ) : (
          <Button
            className="w-full sm:w-auto"
            disabled={busy}
            onClick={() => void activate(primary)}
          >
            {busy ? "Working…" : primary.label}
          </Button>
        )
      ) : null}

      {primary ? <p className="text-xs text-[var(--mpa-color-text-secondary)]">{primary.description}</p> : null}

      {secondary.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {secondary.map((action) =>
            action.href ? (
              <Link key={action.label} href={action.href}>
                <Button size="sm" variant="secondary" disabled={busy}>
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button
                key={action.label}
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => void activate(action)}
              >
                {action.label}
              </Button>
            )
          )}
        </div>
      ) : null}

      {busy ? <OperationalStatus message="Updating work order…" /> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <ApiErrorAlert message={error} /> : null}

      <ConfirmActionDialog
        open={Boolean(pending?.confirm)}
        title={pending?.confirm?.title ?? "Confirm"}
        consequence={pending?.confirm?.consequence ?? ""}
        confirmLabel={pending?.confirm?.confirmLabel ?? "Confirm"}
        tone={pending?.confirm?.tone ?? "default"}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={async () => {
          const action = pending;
          setPending(null);
          if (action?.run) await action.run();
        }}
      />
    </Card>
  );
}

function resolvePrimaryAction(args: {
  status: MaintenanceStatus;
  assignmentStatus: string | null;
  canUpdate: boolean;
  canAssignVendor: boolean;
  canArchive: boolean;
  tenantId: string | null;
  workOrderId: string;
  patchWorkOrder: (body: Record<string, unknown>) => Promise<void>;
  archiveWithUndo: () => Promise<void>;
  onCompleted: () => void;
}): PrimaryAction | null {
  const {
    status,
    assignmentStatus,
    canUpdate,
    canAssignVendor,
    canArchive,
    tenantId,
    patchWorkOrder,
    archiveWithUndo,
    onCompleted
  } = args;

  if ((status === "submitted" || status === "triaged") && canAssignVendor) {
    return {
      label: "Assign Vendor",
      description: "Pick a preferred or recent vendor below, then assign in one click.",
      href: `#vendor`
    };
  }

  if (status === "assigned" && assignmentStatus && ["pending", "awaiting_response"].includes(assignmentStatus)) {
    return {
      label: "Notify Vendor",
      description: "Mark the assignment as awaiting response so the vendor is in the follow-up queue.",
      run: () =>
        patchWorkOrder({
          action: "update_vendor_status",
          assignmentStatus: "awaiting_response"
        })
    };
  }

  if (
    (status === "assigned" || status === "triaged") &&
    assignmentStatus &&
    ["accepted", "en_route", "arrived"].includes(assignmentStatus) &&
    canUpdate
  ) {
    return {
      label: "Mark In Progress",
      description: "Vendor is engaged — move the work order into active work.",
      run: () => patchWorkOrder({ action: "update", status: "in_progress" })
    };
  }

  if (status === "assigned" && canUpdate && !assignmentStatus) {
    return {
      label: "Mark In Progress",
      description: "Staff is handling this without a vendor — start active work.",
      run: () => patchWorkOrder({ action: "update", status: "in_progress" })
    };
  }

  if (
    (status === "in_progress" ||
      status === "on_hold" ||
      status === "vendor_on_site" ||
      status === "awaiting_approval") &&
    canUpdate
  ) {
    return {
      label: "Complete Work",
      description: "Marks the work order complete and notifies stakeholders via existing maintenance notifications.",
      confirm: {
        title: "Complete this work order?",
        consequence:
          "The work order will be marked completed. Residents and assignees may receive existing completion notifications. You can still archive afterward.",
        confirmLabel: "Complete work order"
      },
      run: async () => {
        await patchWorkOrder({ action: "update", status: "completed" });
        onCompleted();
      }
    };
  }

  if (status === "completed" && tenantId) {
    return {
      label: "Request Resident Confirmation",
      description: "Message the resident to confirm the repair — completion notifications already went out.",
      href: `#conversation`
    };
  }

  if (status === "completed" && canArchive) {
    return {
      label: "Close Work Order",
      description: "Archive the completed work order — the close step in the maintenance loop.",
      confirm: {
        title: "Close this work order?",
        consequence:
          "The work order will be archived from the active queue. You can undo from the toast for a few seconds, or restore later from archived records.",
        confirmLabel: "Close work order",
        tone: "danger"
      },
      run: () => archiveWithUndo()
    };
  }

  if ((status === "submitted" || status === "triaged") && canUpdate && !canAssignVendor) {
    return {
      label: "Mark In Progress",
      description: "Triage complete — begin work.",
      run: () => patchWorkOrder({ action: "update", status: "in_progress" })
    };
  }

  return null;
}

function resolveSecondaryActions(args: {
  status: MaintenanceStatus;
  canUpdate: boolean;
  canAssignVendor: boolean;
  canArchive: boolean;
  tenantId: string | null;
  workOrderId: string;
  patchWorkOrder: (body: Record<string, unknown>) => Promise<void>;
  archiveWithUndo: () => Promise<void>;
}): PrimaryAction[] {
  const { status, canUpdate, canAssignVendor, canArchive, tenantId, workOrderId, patchWorkOrder, archiveWithUndo } =
    args;
  const actions: PrimaryAction[] = [];

  if (canAssignVendor && status !== "completed" && status !== "cancelled") {
    actions.push({ label: "Vendor panel", description: "", href: "#vendor" });
  }

  if (canUpdate && (status === "submitted" || status === "triaged")) {
    actions.push({
      label: "Triage",
      description: "",
      run: () => patchWorkOrder({ action: "update", status: "triaged" })
    });
  }

  if (canUpdate && status === "in_progress") {
    actions.push({
      label: "Put on hold",
      description: "",
      run: () => patchWorkOrder({ action: "update", status: "on_hold" })
    });
  }

  if (status === "completed" && tenantId && canArchive) {
    actions.push({
      label: "Close Work Order",
      description: "",
      confirm: {
        title: "Close this work order?",
        consequence:
          "The work order will be archived from the active queue. Undo is available briefly after confirm.",
        confirmLabel: "Close work order",
        tone: "danger"
      },
      run: () => archiveWithUndo()
    });
  }

  actions.push({
    label: "Edit details",
    description: "",
    href: `/maintenance/${workOrderId}/edit`
  });

  return actions;
}
