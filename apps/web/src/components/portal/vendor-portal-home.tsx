"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Select } from "@mpa/ui";
import {
  toVendorAssignmentStatusLabel,
  type VendorAssignmentStatus
} from "../../lib/vendor/contracts";
import { toMaintenanceStatusLabel } from "../../lib/maintenance/contracts";

type VendorWorkOrderCard = {
  id: string;
  workOrderNumber: string;
  title: string;
  status: string;
  assignmentStatus: VendorAssignmentStatus | null;
  propertyName: string | null;
  unitNumber: string | null;
};

const VENDOR_STATUS_OPTIONS: VendorAssignmentStatus[] = [
  "accepted",
  "en_route",
  "arrived",
  "in_progress",
  "completed"
];

export function VendorPortalHome({
  vendorName,
  workOrders
}: {
  vendorName: string | null;
  workOrders: VendorWorkOrderCard[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(workOrderId: string, assignmentStatus: VendorAssignmentStatus) {
    setError(null);
    setPendingId(workOrderId);
    const response = await fetch(`/api/maintenance/${workOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_vendor_status", assignmentStatus })
    });
    setPendingId(null);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
      setError(payload?.error ?? payload?.message ?? "Could not update assignment status.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          {vendorName ? `${vendorName} work queue` : "Vendor work queue"}
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Review assigned work orders and post status updates for the property manager and resident.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {workOrders.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            No assigned work orders yet. When a manager assigns you, they will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {workOrders.map((workOrder) => (
            <Card key={workOrder.id} className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{workOrder.title}</p>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                  {workOrder.workOrderNumber} · {toMaintenanceStatusLabel(workOrder.status as never)}
                  {workOrder.propertyName ? ` · ${workOrder.propertyName}` : ""}
                  {workOrder.unitNumber ? ` · Unit ${workOrder.unitNumber}` : ""}
                </p>
                {workOrder.assignmentStatus ? (
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                    Assignment: {toVendorAssignmentStatusLabel(workOrder.assignmentStatus)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  aria-label="Update assignment status"
                  defaultValue=""
                  disabled={pendingId === workOrder.id}
                  onChange={(event) => {
                    const value = event.target.value as VendorAssignmentStatus;
                    if (value) void updateStatus(workOrder.id, value);
                    event.target.value = "";
                  }}
                >
                  <option value="">Update status…</option>
                  {VENDOR_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {toVendorAssignmentStatusLabel(status)}
                    </option>
                  ))}
                </Select>
                {pendingId === workOrder.id ? (
                  <Button size="sm" variant="ghost" disabled>
                    Saving…
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
