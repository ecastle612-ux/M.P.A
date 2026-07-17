import Link from "next/link";
import { ContextRail, ContextRailSection } from "../context-rail";
import { CONTEXT_RAIL_EMPTY } from "../../../lib/experience/context-rail-empty";
import { toMaintenanceCategoryLabel } from "../../../lib/maintenance/contracts";
import type { MaintenanceActivityEvent } from "../../../lib/maintenance/contracts";

export function MaintenanceContextRail({
  propertyId,
  propertyName,
  unitId,
  unitNumber,
  tenantId,
  tenantName,
  vendorName,
  vendorId,
  priority,
  status,
  dueDate,
  overdue,
  category,
  events,
  relatedHistory
}: {
  propertyId: string;
  propertyName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  tenantId: string | null;
  tenantName: string | null;
  vendorName: string | null;
  vendorId: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  overdue: boolean;
  category: string;
  events: MaintenanceActivityEvent[];
  relatedHistory: Array<{ id: string; workOrderNumber: string; title: string }>;
}) {
  return (
    <ContextRail title="Work order context">
      <ContextRailSection title="Property">
        <Link href={`/properties/${propertyId}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
          {propertyName ?? propertyId}
        </Link>
      </ContextRailSection>

      <ContextRailSection title="Unit">
        {unitId ? (
          <Link href={`/units/${unitId}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
            {unitNumber ? `Unit ${unitNumber}` : unitId}
          </Link>
        ) : (
          <p>Not assigned</p>
        )}
      </ContextRailSection>

      <ContextRailSection title="Tenant">
        {tenantId ? (
          <Link href={`/tenants/${tenantId}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
            {tenantName ?? tenantId}
          </Link>
        ) : (
          <p>Not linked</p>
        )}
      </ContextRailSection>

      <ContextRailSection title="Vendor">
        {vendorId && vendorName ? (
          <Link href={`/vendors/${vendorId}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
            {vendorName}
          </Link>
        ) : (
          <p>Unassigned</p>
        )}
      </ContextRailSection>

      <ContextRailSection title="Priority & status">
        <div className="space-y-1">
          <p>
            <span className="mpa-section-label">Priority</span> · {priority}
          </p>
          <p>
            <span className="mpa-section-label">Status</span> · {status.replaceAll("_", " ")}
          </p>
          <p>
            <span className="mpa-section-label">Category</span> · {toMaintenanceCategoryLabel(category as Parameters<typeof toMaintenanceCategoryLabel>[0])}
          </p>
          <p className={overdue ? "font-medium text-[var(--mpa-color-feedback-error)]" : ""}>
            Due: {dueDate ?? "—"}
            {overdue ? " (overdue)" : ""}
          </p>
        </div>
      </ContextRailSection>

      <ContextRailSection title="Timeline" emptyMessage={CONTEXT_RAIL_EMPTY.maintenance.timeline}>
        {events.length > 0 ? (
          <ul className="space-y-2">
            {events.slice(0, 8).map((event) => (
              <li key={event.id} className="border-l-2 border-[var(--mpa-color-border-subtle)] pl-2 text-xs">
                <p className="font-medium">{event.eventType.replaceAll("_", " ")}</p>
                <p className="text-[var(--mpa-color-text-muted)]">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>

      <ContextRailSection title="Attachments" variant="muted">
        <p className="text-xs">Photo and document attachments reserved for a future phase.</p>
      </ContextRailSection>

      <ContextRailSection title="Related history" emptyMessage={CONTEXT_RAIL_EMPTY.maintenance.relatedHistory}>
        {relatedHistory.length > 0 ? (
          <ul className="space-y-2">
            {relatedHistory.map((entry) => (
              <li key={entry.id}>
                <Link href={`/maintenance/${entry.id}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                  {entry.workOrderNumber}
                </Link>
                <p className="text-xs">{entry.title}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>
    </ContextRail>
  );
}
