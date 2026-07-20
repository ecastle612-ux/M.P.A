"use client";

import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@mpa/ui";
import type {
  AnnouncementReadRecord,
  AnnouncementRecipientRecord
} from "../../lib/communication/contracts";

function deliveryStatusLabel(status: AnnouncementRecipientRecord["deliveryStatus"]): string {
  const labels: Record<AnnouncementRecipientRecord["deliveryStatus"], string> = {
    pending: "Pending",
    delivered: "Delivered",
    failed: "Failed",
    placeholder: "Recorded"
  };
  return labels[status];
}

function deliveryBadgeVariant(status: AnnouncementRecipientRecord["deliveryStatus"]): "success" | "warning" | "info" {
  if (status === "delivered") return "success";
  if (status === "failed") return "warning";
  return "info";
}

export function AnnouncementReadershipPanel({
  recipientCount,
  readCount,
  recipients,
  reads
}: {
  recipientCount: number;
  readCount: number;
  recipients: AnnouncementRecipientRecord[];
  reads: AnnouncementReadRecord[];
}) {
  const readRate = recipientCount > 0 ? Math.round((readCount / recipientCount) * 100) : 0;

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Readership</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Delivery and read receipt analytics for this announcement.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">Recipients</p>
          <p className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">{recipientCount}</p>
        </div>
        <div className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">Read</p>
          <p className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">{readCount}</p>
        </div>
        <div className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3">
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">Read rate</p>
          <p className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">{readRate}%</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Delivery status</h3>
        {recipients.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No recipients resolved yet.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Channel</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Delivered</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recipients.map((recipient) => (
                  <TableRow key={recipient.id}>
                    <TableCell>{recipient.deliveryChannel}</TableCell>
                    <TableCell>
                      <Badge variant={deliveryBadgeVariant(recipient.deliveryStatus)}>
                        {deliveryStatusLabel(recipient.deliveryStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {recipient.deliveredAt ? new Date(recipient.deliveredAt).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Read receipts</h3>
        {reads.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No read receipts recorded yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {reads.map((read) => (
              <li
                key={read.id}
                className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3 text-sm text-[var(--mpa-color-text-secondary)]"
              >
                <p className="font-medium text-[var(--mpa-color-text-primary)]">Resident {read.userId.slice(0, 8)}…</p>
                <p>Read: {new Date(read.readAt).toLocaleString()}</p>
                {read.acknowledgedAt ? <p>Acknowledged: {new Date(read.acknowledgedAt).toLocaleString()}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
