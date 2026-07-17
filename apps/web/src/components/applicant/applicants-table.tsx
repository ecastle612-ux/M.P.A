"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Input, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@mpa/ui";
import { APPLICANT_STATUSES, toApplicantStatusLabel, type ApplicantRecord } from "../../lib/applicant/contracts";
import { DataTableLayout } from "../presentation/data-table-layout";
import { ListWorkspaceHeader } from "../presentation/list-workspace-header";
import { getFilteredEmptyMessage } from "../../lib/experience/empty-states";

type ApplicantListItem = ApplicantRecord & {
  propertyName: string | null;
  unitNumber: string | null;
};

const PAGE_SIZE = 10;

export function ApplicantsTable({
  initialItems,
  permissions
}: {
  initialItems: ApplicantListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "status" | "updated">("updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  const visibleItems = useMemo(() => items.filter((item) => item.deletedAt === null), [items]);
  const filteredItems = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    let matched = visibleItems;
    if (statusFilter !== "all") matched = matched.filter((item) => item.status === statusFilter);
    if (trimmed) {
      matched = matched.filter((item) => {
        const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
        return (
          fullName.includes(trimmed) ||
          item.applicationNumber.toLowerCase().includes(trimmed) ||
          item.email.toLowerCase().includes(trimmed) ||
          (item.propertyName ?? "").toLowerCase().includes(trimmed)
        );
      });
    }
    return [...matched].sort((left, right) => {
      const direction = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "status") return left.status.localeCompare(right.status) * direction;
      if (sortBy === "name") {
        return `${left.lastName},${left.firstName}`.localeCompare(`${right.lastName},${right.firstName}`) * direction;
      }
      return left.updatedAt.localeCompare(right.updatedAt) * direction;
    });
  }, [query, sortBy, sortOrder, statusFilter, visibleItems]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function runAction(applicantId: string, action: "archive" | "restore" | "soft_delete") {
    setError(null);
    setSubmittingAction(`${applicantId}:${action}`);
    const response = await fetch(`/api/applicants/${applicantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    setSubmittingAction(null);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Applicant action failed.");
      return;
    }
    const payload = (await response.json()) as { applicant?: ApplicantListItem };
    if (!payload.applicant) return;
    if (action === "soft_delete") {
      setItems((current) => current.filter((item) => item.id !== applicantId));
      return;
    }
    setItems((current) => current.map((item) => (item.id === applicantId ? { ...item, ...payload.applicant } : item)));
  }

  if (visibleItems.length === 0) {
    return (
      <div className="space-y-4">
        <ListWorkspaceHeader
          metrics={[{ label: "Applications", value: "0", hint: "No applications yet" }]}
          recommendationsPlaceholder="Create an application to begin the onboarding pipeline."
        />
        {permissions.canCreate ? (
          <div className="flex justify-end">
            <Link href="/applicants/new">
              <Button>New application</Button>
            </Link>
          </div>
        ) : null}
        <p className="rounded-lg border border-dashed border-[var(--mpa-color-border-default)] p-6 text-sm text-[var(--mpa-color-text-secondary)]">
          No applicants yet. Start an application to track screening, documents, and move-in readiness.
        </p>
      </div>
    );
  }

  const pendingCount = visibleItems.filter((item) =>
    ["submitted", "pending_review", "awaiting_documents", "screening_in_progress"].includes(item.status)
  ).length;

  return (
    <div className="space-y-5">
      <ListWorkspaceHeader
        metrics={[
          { label: "Applications", value: visibleItems.length.toString(), hint: `${pendingCount} in pipeline` },
          {
            label: "Approved",
            value: visibleItems.filter((item) => item.status === "approved").length.toString(),
            hint: "Ready for move-in"
          },
          {
            label: "Converted",
            value: visibleItems.filter((item) => item.status === "converted_to_resident").length.toString(),
            hint: "Residents created"
          }
        ]}
        recommendationsPlaceholder="Use status actions on each application to advance screening and conversion."
      />
      <DataTableLayout
        overline="Onboarding"
        title="Applicants"
        description="Manage rental applications from intake through resident conversion."
        actions={
          permissions.canCreate ? (
            <Link href="/applicants/new">
              <Button>New application</Button>
            </Link>
          ) : null
        }
        filters={
          <>
            <Input
              aria-label="Search applicants"
              placeholder="Search by name, email, application number"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All statuses</option>
              {APPLICANT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {toApplicantStatusLabel(status)}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Sort applicants"
              value={`${sortBy}:${sortOrder}`}
              onChange={(event) => {
                const [nextSortBy, nextSortOrder] = event.target.value.split(":") as [typeof sortBy, typeof sortOrder];
                setSortBy(nextSortBy);
                setSortOrder(nextSortOrder);
                setPage(1);
              }}
            >
              <option value="updated:desc">Recently updated</option>
              <option value="updated:asc">Oldest updated</option>
              <option value="name:asc">Name A–Z</option>
              <option value="status:asc">Status</option>
            </Select>
          </>
        }
        error={error}
        emptyFilteredMessage={getFilteredEmptyMessage("tenants")}
        showEmptyFiltered={filteredItems.length === 0}
        page={currentPage}
        pageCount={pageCount}
        totalItems={filteredItems.length}
        pageSize={PAGE_SIZE}
        onPreviousPage={() => setPage((value) => Math.max(1, value - 1))}
        onNextPage={() => setPage((value) => Math.min(pageCount, value + 1))}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Application</TableHeaderCell>
                <TableHeaderCell>Applicant</TableHeaderCell>
                <TableHeaderCell>Property</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Move-in</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/applicants/${item.id}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                      {item.applicationNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.preferredName || `${item.firstName} ${item.lastName}`}</p>
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.propertyName ? (
                      <>
                        <p>{item.propertyName}</p>
                        {item.unitNumber ? <p className="text-xs text-[var(--mpa-color-text-secondary)]">Unit {item.unitNumber}</p> : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "approved" ? "success" : item.status === "declined" ? "danger" : "neutral"}>
                      {toApplicantStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.plannedMoveInDate ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/applicants/${item.id}`}>
                        <Button size="sm" variant="secondary">
                          View
                        </Button>
                      </Link>
                      {permissions.canArchive && !item.archivedAt ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={submittingAction === `${item.id}:archive`}
                          onClick={() => void runAction(item.id, "archive")}
                        >
                          Archive
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DataTableLayout>
    </div>
  );
}
