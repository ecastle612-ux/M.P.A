"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@mpa/ui";
import { toPropertyStatusLabel, toPropertyTypeLabel, type PropertyRecord } from "../../lib/property/contracts";
import { MpaLogo } from "../branding/mpa-logo";

type PropertyListItem = PropertyRecord & { unitCount: number };

export function PropertiesTable({
  initialItems,
  permissions
}: {
  initialItems: PropertyListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
}) {
  const [items, setItems] = useState(initialItems);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);

  async function runAction(propertyId: string, action: "archive" | "restore" | "soft_delete") {
    setError(null);
    setSubmittingAction(`${propertyId}:${action}`);
    const response = await fetch(`/api/properties/${propertyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setSubmittingAction(null);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Property action failed.");
      return;
    }
    const payload = (await response.json()) as { property?: PropertyListItem };
    if (!payload.property) {
      return;
    }
    if (action === "soft_delete") {
      setItems((current) => current.filter((item) => item.id !== propertyId));
      return;
    }
    setItems((current) => current.map((item) => (item.id === propertyId ? { ...item, ...payload.property } : item)));
  }

  if (visibleItems.length === 0) {
    return (
      <Card>
        <MpaLogo className="mb-2 h-12 w-auto" alt="M.P.A. logo" />
        <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">No properties yet</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Create your first property to start organizing your portfolio.
        </p>
        {permissions.canCreate ? (
          <Link href="/properties/new" className="mt-3 inline-block">
            <Button>Create Property</Button>
          </Link>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Property Portfolio</h2>
        {permissions.canCreate ? (
          <Link href="/properties/new">
            <Button>Create Property</Button>
          </Link>
        ) : null}
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Property</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Units</TableHeaderCell>
              <TableHeaderCell>Updated</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {visibleItems.map((item) => {
              const busyArchive =
                submittingAction === `${item.id}:archive` || submittingAction === `${item.id}:restore`;
              const busyDelete = submittingAction === `${item.id}:soft_delete`;
              const isArchived = item.status === "archived";
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.name}</p>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {item.city}, {item.stateRegion}
                    </p>
                  </TableCell>
                  <TableCell>{toPropertyTypeLabel(item.propertyType)}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "active" ? "success" : item.status === "archived" ? "warning" : "info"}>
                      {toPropertyStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.unitCount}</TableCell>
                  <TableCell>{formatDate(item.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link href={`/properties/${item.id}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                      {permissions.canUpdate ? (
                        <Link href={`/properties/${item.id}/edit`}>
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

function formatDate(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "recently";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(timestamp);
}
