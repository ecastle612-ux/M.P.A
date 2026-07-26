"use client";

import { Badge, Card } from "@mpa/ui";

import { StandaloneOpenLink } from "@/components/pwa/standalone-open-link";
import type { OwnerFinancialStatementRow } from "../../lib/owner-portal/financial-shared";

export function OwnerStatementRow({ statement }: { statement: OwnerFinancialStatementRow }) {
  return (
    <li>
      <Card variant="elevated" className="space-y-1 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{statement.periodLabel}</p>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              {statement.statementNumber} · {statement.propertyName} · Statement date{" "}
              {statement.statementDateLabel}
              {statement.generatedAtLabel ? ` · Generated ${statement.generatedAtLabel}` : null}
            </p>
          </div>
          <Badge variant={statement.status === "sent" ? "success" : "neutral"}>{statement.statusLabel}</Badge>
        </div>
        {statement.downloadHref ? (
          <p className="text-xs">
            <StandaloneOpenLink
              href={statement.downloadHref}
              documentTitle={statement.statementNumber}
              mode="viewer"
              className="font-medium text-[var(--mpa-color-text-link)] underline"
            >
              Download PDF
            </StandaloneOpenLink>
          </p>
        ) : (
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            PDF download is not available for this statement yet.
          </p>
        )}
      </Card>
    </li>
  );
}
