import { Card, EmptyState } from "@mpa/ui";

export default function TenantPortalPage() {
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          Tenant portal foundation
        </h2>
        <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
          No business workflows are implemented in this phase. This shell is ready for future tenant
          modules.
        </p>
      </div>
      <EmptyState
        title="No tenant workspace modules yet"
        description="Rent, maintenance requests, and documents will appear here once those workflows are approved."
        className="bg-[var(--mpa-color-bg-surface-muted)]"
      />
    </Card>
  );
}
