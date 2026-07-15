"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, Select, Textarea } from "@mpa/ui";
import {
  VENDOR_ASSIGNMENT_STATUSES,
  toVendorAssignmentStatusLabel,
  type VendorAssignmentRecord
} from "../../lib/vendor/contracts";
import type { VendorAssignmentListItem } from "../../lib/vendor/server";

export type VendorOption = {
  id: string;
  businessName: string;
  preferredVendor: boolean;
};

export function VendorAssignmentPanel({
  workOrderId,
  vendors,
  initialAssignments,
  initialCurrentAssignment
}: {
  workOrderId: string;
  vendors: VendorOption[];
  initialAssignments: VendorAssignmentListItem[];
  initialCurrentAssignment: VendorAssignmentListItem | null;
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [currentAssignment, setCurrentAssignment] = useState(initialCurrentAssignment);
  const [selectedVendorId, setSelectedVendorId] = useState(
    initialCurrentAssignment?.vendorId ?? vendors[0]?.id ?? ""
  );
  const [assignmentStatus, setAssignmentStatus] = useState(
    initialCurrentAssignment?.assignmentStatus ?? "pending"
  );
  const [completionNotes, setCompletionNotes] = useState(initialCurrentAssignment?.completionNotes ?? "");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMutation(
    action: "assign_vendor" | "reassign_vendor" | "update_vendor_status",
    extra?: Record<string, unknown>
  ) {
    setError(null);
    setSubmitting(action);
    const response = await fetch(`/api/maintenance/${workOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra })
    });
    setSubmitting(null);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Vendor assignment update failed.");
      return;
    }

    const payload = (await response.json()) as {
      assignment?: VendorAssignmentListItem;
      assignments?: VendorAssignmentListItem[];
      currentAssignment?: VendorAssignmentListItem | null;
    };

    if (payload.assignments) {
      setAssignments(payload.assignments);
    }
    if (payload.currentAssignment !== undefined) {
      setCurrentAssignment(payload.currentAssignment);
      if (payload.currentAssignment) {
        setAssignmentStatus(payload.currentAssignment.assignmentStatus);
        setCompletionNotes(payload.currentAssignment.completionNotes ?? "");
        setSelectedVendorId(payload.currentAssignment.vendorId);
      }
    } else if (payload.assignment) {
      setCurrentAssignment(payload.assignment);
      setAssignmentStatus(payload.assignment.assignmentStatus);
      setCompletionNotes(payload.assignment.completionNotes ?? "");
    }
  }

  async function handleAssign() {
    if (!selectedVendorId) {
      setError("Select a vendor to assign.");
      return;
    }
    await runMutation(currentAssignment ? "reassign_vendor" : "assign_vendor", { vendorId: selectedVendorId });
  }

  async function handleStatusUpdate() {
    if (!currentAssignment) {
      setError("Assign a vendor before updating status.");
      return;
    }
    await runMutation("update_vendor_status", {
      assignmentStatus,
      completionNotes: completionNotes || null
    });
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Vendor assignment</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Assign external vendors and track assignment progress on this work order.
        </p>
      </div>

      {currentAssignment ? (
        <div className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface-muted)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-muted)]">Current vendor</p>
          <p className="mt-1 font-medium text-[var(--mpa-color-text-primary)]">
            <Link href={`/vendors/${currentAssignment.vendorId}`} className="text-[var(--mpa-color-brand-primary)] hover:underline">
              {currentAssignment.vendorBusinessName}
            </Link>
          </p>
          <Badge variant="info" className="mt-2">
            {toVendorAssignmentStatusLabel(currentAssignment.assignmentStatus)}
          </Badge>
        </div>
      ) : (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">No vendor assigned yet.</p>
      )}

      <div className="grid gap-3">
        <Select
          aria-label="Vendor"
          value={selectedVendorId}
          onChange={(event) => setSelectedVendorId(event.target.value)}
        >
          <option value="">Select vendor</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.businessName}
              {vendor.preferredVendor ? " (Preferred)" : ""}
            </option>
          ))}
        </Select>
        <Button type="button" disabled={submitting === "assign_vendor" || submitting === "reassign_vendor"} onClick={handleAssign}>
          {submitting === "assign_vendor" || submitting === "reassign_vendor"
            ? "Saving..."
            : currentAssignment
              ? "Reassign vendor"
              : "Assign vendor"}
        </Button>
      </div>

      {currentAssignment ? (
        <div className="space-y-3 border-t border-[var(--mpa-color-border-subtle)] pt-4">
          <Select
            aria-label="Assignment status"
            value={assignmentStatus}
            onChange={(event) => setAssignmentStatus(event.target.value as VendorAssignmentRecord["assignmentStatus"])}
          >
            {VENDOR_ASSIGNMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {toVendorAssignmentStatusLabel(status)}
              </option>
            ))}
          </Select>
          <Textarea
            aria-label="Completion notes"
            placeholder="Completion notes"
            rows={3}
            value={completionNotes}
            onChange={(event) => setCompletionNotes(event.target.value)}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={submitting === "update_vendor_status"}
            onClick={handleStatusUpdate}
          >
            {submitting === "update_vendor_status" ? "Saving..." : "Update assignment status"}
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}

      <div className="space-y-2 border-t border-[var(--mpa-color-border-subtle)] pt-4">
        <h3 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Assignment history</h3>
        {assignments.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No assignment history yet.</p>
        ) : (
          <ul className="space-y-2">
            {assignments.map((entry) => (
              <li
                key={entry.id}
                className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3 text-sm text-[var(--mpa-color-text-secondary)]"
              >
                <p className="font-medium text-[var(--mpa-color-text-primary)]">
                  {entry.vendorBusinessName}
                  {entry.isCurrent ? (
                    <Badge variant="success" className="ml-2">
                      Current
                    </Badge>
                  ) : null}
                </p>
                <p>{toVendorAssignmentStatusLabel(entry.assignmentStatus)}</p>
                <p className="text-xs">Assigned {new Date(entry.assignedAt).toLocaleString()}</p>
                {entry.completionNotes ? <p className="mt-1 text-xs">Notes: {entry.completionNotes}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
