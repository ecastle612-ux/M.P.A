import { Card, EmptyState } from "@mpa/ui";

export default function OwnerPortalPage() {
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          Owner portal foundation
        </h2>
        <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
          No business workflows are implemented in this phase. This shell is ready for future owner
          modules.
        </p>
      </div>
      <EmptyState
        title="No owner reports yet"
        description="Property performance and owner reporting modules will land here after approval."
        className="bg-[var(--mpa-color-bg-surface-muted)]"
      />
    </Card>
  );
}
