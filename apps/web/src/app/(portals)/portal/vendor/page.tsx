import { Card, EmptyState } from "@mpa/ui";

export default function VendorPortalPage() {
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          Vendor portal foundation
        </h2>
        <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
          No business workflows are implemented in this phase. This shell is ready for future vendor
          modules.
        </p>
      </div>
      <EmptyState
        title="No vendor jobs yet"
        description="Job inbox, bids, and compliance modules will appear here after marketplace workflows are approved."
        className="bg-[var(--mpa-color-bg-surface-muted)]"
      />
    </Card>
  );
}
