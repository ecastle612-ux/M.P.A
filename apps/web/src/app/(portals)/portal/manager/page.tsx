import { Card, EmptyState } from "@mpa/ui";

export default function ManagerPortalPage() {
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          Manager portal foundation
        </h2>
        <p className="text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
          No business workflows are implemented in this phase. This shell is ready for future
          manager modules.
        </p>
      </div>
      <EmptyState
        title="No operations modules yet"
        description="Maintenance, leasing, and portfolio workflows will appear here once approved and implemented."
        className="bg-[var(--mpa-color-bg-surface-muted)]"
      />
    </Card>
  );
}
