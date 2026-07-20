import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import type { FacilityRecordListItem } from "../../lib/facility/contracts";

export function RepairHistoryPanel({
  title,
  description,
  records,
  emptyLabel,
  showUnit = true,
  showProperty = false
}: {
  title: string;
  description: string;
  records: FacilityRecordListItem[];
  emptyLabel: string;
  showUnit?: boolean;
  showProperty?: boolean;
}) {
  return (
    <Card variant="elevated" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="mpa-section-title">{title}</h2>
          <p className="mt-0.5 text-sm leading-snug text-[var(--mpa-color-text-secondary)]">{description}</p>
        </div>
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-muted)]">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-[var(--mpa-color-border-default)]">
          {records.map((record) => (
            <li key={record.id} className="flex flex-wrap items-start justify-between gap-2 py-2 first:pt-0 last:pb-0">
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{record.issue}</p>
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                  {new Date(record.completedAt).toLocaleDateString()}
                  {showProperty && record.propertyName ? ` · ${record.propertyName}` : ""}
                  {showUnit && record.unitNumber ? ` · Unit ${record.unitNumber}` : ""}
                  {record.serviceProviderDisplayName
                    ? ` · ${record.serviceProviderDisplayName}`
                    : ""}
                  {record.workOrderNumber ? ` · ${record.workOrderNumber}` : ""}
                </p>
                {record.resolution ? (
                  <p className="line-clamp-2 text-sm text-[var(--mpa-color-text-muted)]">
                    {record.resolution}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/facility/records/${record.id}`}>
                  <Button variant="secondary" size="sm">
                    View record
                  </Button>
                </Link>
                <Link href={`/maintenance/${record.workOrderId}`}>
                  <Button variant="ghost" size="sm">
                    Work order
                  </Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
