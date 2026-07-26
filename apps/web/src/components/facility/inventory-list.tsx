import Link from "next/link";
import { Badge, Button, Card } from "@mpa/ui";
import type { FacilityInventoryListItem } from "../../lib/facility/inventory-contracts";
import { formatInventoryStatusLabel } from "../../lib/facility/inventory-contracts";

const primaryLinkClass =
  "inline-flex h-9 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-brand-primary-hover)]";

export function InventoryList({
  items,
  canWrite,
  statusFilter,
  query
}: {
  items: FacilityInventoryListItem[];
  canWrite: boolean;
  statusFilter?: string;
  query?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Inventory</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Tools and materials — photo first, details later.
          </p>
        </div>
        {canWrite ? (
          <Link href="/facility/inventory/new" className={primaryLinkClass}>
            Add inventory
          </Link>
        ) : null}
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={query ?? ""}
          placeholder="Search name, category, serial…"
          className="min-w-[12rem] flex-1 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
          aria-label="Search inventory"
        />
        <select
          name="status"
          defaultValue={statusFilter ?? ""}
          className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="in_service">In service</option>
          <option value="repair">Repair</option>
          <option value="disposed">Disposed</option>
          <option value="retired">Retired</option>
          <option value="lost">Lost</option>
          <option value="stolen">Stolen</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {items.length === 0 ? (
        <Card className="space-y-3" padding="lg">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            No inventory items yet
            {query || statusFilter ? " match this filter" : ""}.
          </p>
          {canWrite ? (
            <Link href="/facility/inventory/new" className={primaryLinkClass}>
              Add the first item
            </Link>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/facility/inventory/${item.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--mpa-color-border-subtle)] px-3 py-3 transition hover:bg-[var(--mpa-color-bg-surface-muted)]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--mpa-color-text-primary)]">
                  {item.name}
                </p>
                <p className="truncate text-xs text-[var(--mpa-color-text-secondary)]">
                  {item.propertyName ?? "No building/site"}
                  {item.category ? ` · ${item.category}` : ""}
                </p>
              </div>
              <Badge>{formatInventoryStatusLabel(item.status)}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
