import { Card } from "@mpa/ui";
import { getPortalDemoFixture } from "../../lib/master-admin/demo-fixtures";
import type { MasterAdminPortal } from "../../lib/master-admin/contracts";

export function MasterAdminPortalDemoPanel({ portal }: { portal: MasterAdminPortal }) {
  const fixture = getPortalDemoFixture(portal);
  return (
    <Card className="space-y-3 border-[var(--mpa-color-status-warning,#D97706)]/30">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--mpa-color-text-tertiary)]">
          Demo data · Master Admin Test Mode
        </p>
        <h2 className="mt-1 font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          {fixture.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{fixture.summary}</p>
      </div>
      <ul className="space-y-2">
        {fixture.cards.map((card) => (
          <li
            key={card.label}
            className="rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-bg-muted)] px-3 py-2 text-sm"
          >
            <span className="font-medium text-[var(--mpa-color-text-primary)]">{card.label}: </span>
            <span className="text-[var(--mpa-color-text-secondary)]">{card.value}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
