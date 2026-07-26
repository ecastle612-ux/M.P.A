import Link from "next/link";
import { Badge, Card } from "@mpa/ui";
import type { OwnerPropertyListCard } from "../../lib/owner-portal/property-experience";

export function OwnerPropertyCard({ property }: { property: OwnerPropertyListCard }) {
  const occupancy =
    property.occupancyPercent === null
      ? "Units not configured"
      : `${property.occupancyPercent}% occupied (${property.occupiedUnits}/${property.unitCount})`;

  return (
    <li>
      <Card variant="elevated" className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                {property.name}
              </p>
              <Badge variant={property.status === "active" ? "success" : "neutral"}>
                {property.statusLabel}
              </Badge>
              <Badge variant="neutral">{property.propertyTypeLabel}</Badge>
            </div>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">{property.address}</p>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              {property.unitCount} units · {occupancy}
              {property.monthlyRevenueLabel
                ? ` · Collections (MTD) ${property.monthlyRevenueLabel}`
                : null}
              {property.openMaintenanceCount !== null
                ? ` · ${property.openMaintenanceCount} open maintenance`
                : null}
            </p>
          </div>
          <Link
            href={`/portal/owner/properties/${property.id}`}
            className="text-xs font-medium text-[var(--mpa-color-text-link)]"
          >
            View property →
          </Link>
        </div>
      </Card>
    </li>
  );
}
