"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@mpa/ui";
import { toUnitOccupancyLabel, toUnitStatusLabel, type UnitRecord } from "../../lib/unit/contracts";
import { MpaLogo } from "../branding/mpa-logo";

type UnitListItem = UnitRecord & { propertyName: string | null };

export function UnitsTable({
  initialItems,
  permissions
}: {
  initialItems: UnitListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
}) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);

  async function runAction(unitId: string, action: "archive" | "restore" | "soft_delete") {
    setError(null);
    setSubmittingAction(`${unitId}:${action}`);
    const response = await fetch(`/api/units/${unitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setSubmittingAction(null);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unit action failed.");
      return;
    }
    const payload = (await response.json()) as { unit?: UnitListItem };
    if (!payload.unit) return;
    if (action === "soft_delete") {
      setItems((current) => current.filter((item) => item.id !== unitId));
      return;
    }
    setItems((current) => current.map((item) => (item.id === unitId ? { ...item, ...payload.unit } : item)));
  }

  if (visibleItems.length === 0) {
    return (
      <Card>
        <MpaLogo className="mb-2 h-12 w-auto" alt="M.P.A. logo" />
        <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">No units yet</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Add units to track occupancy, vacancy, and operational readiness.
        </p>
        {permissions.canCreate ? (
          <Link href="/units/new" className="mt-3 inline-block">
            <Button>Create Unit</Button>
          </Link>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Units</h2>
        {permissions.canCreate ? (
          <Link href="/units/new">
            <Button>Create Unit</Button>
          </Link>
        ) : null}
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Unit</TableHeaderCell>
              <TableHeaderCell>Property</TableHeaderCell>
              <TableHeaderCell>Occupancy</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Rent</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {visibleItems.map((item) => {
              const isArchived = item.status === "archived";
              const busyArchive =
                submittingAction === `${item.id}:archive` || submittingAction === `${item.id}:restore`;
              const busyDelete = submittingAction === `${item.id}:soft_delete`;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.unitNumber}</p>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {item.bedrooms ?? "-"} bd / {item.bathrooms ?? "-"} ba / {item.squareFeet ?? "-"} sf
                    </p>
                  </TableCell>
                  <TableCell>{item.propertyName ?? "Unknown property"}</TableCell>
                  <TableCell>
                    <Badge variant={item.occupancyStatus === "occupied" ? "success" : "warning"}>
                      {toUnitOccupancyLabel(item.occupancyStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>{toUnitStatusLabel(item.status)}</TableCell>
                  <TableCell>{item.rentAmount !== null ? formatCurrency(item.rentAmount, item.currencyCode) : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link href={`/units/${item.id}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                      {permissions.canUpdate ? (
                        <Link href={`/units/${item.id}/edit`}>
                          <Button variant="secondary" size="sm">
                            Edit
                          </Button>
                        </Link>
                      ) : null}
                      {permissions.canArchive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyArchive}
                          onClick={() => runAction(item.id, isArchived ? "restore" : "archive")}
                        >
                          {busyArchive ? "Saving..." : isArchived ? "Restore" : "Archive"}
                        </Button>
                      ) : null}
                      {permissions.canDelete ? (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={busyDelete}
                          onClick={() => runAction(item.id, "soft_delete")}
                        >
                          {busyDelete ? "Deleting..." : "Delete"}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function formatCurrency(value: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(value);
}
