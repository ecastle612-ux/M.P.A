"use client";

import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import type { SmartSuggestion } from "./smart-suggestion-builders";

export type { SmartSuggestion };
export {
  vacantUnitSuggestions,
  completedWorkOrderSuggestions,
  lateRentSuggestions
} from "./smart-suggestion-builders";

/**
 * WF-004 — launch existing workflows only (no new modules).
 */
export function SmartSuggestions({
  title = "Suggested actions",
  description,
  suggestions
}: {
  title?: string;
  description?: string;
  suggestions: SmartSuggestion[];
}) {
  if (suggestions.length === 0) return null;

  return (
    <Card className="space-y-3 border-[var(--mpa-color-brand-primary)]/15 bg-[var(--mpa-color-brand-primary-subtle)]/40 p-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Link key={`${suggestion.label}-${suggestion.href}`} href={suggestion.href}>
            <Button type="button" size="sm" variant={suggestion.primary ? "primary" : "secondary"}>
              {suggestion.label}
            </Button>
          </Link>
        ))}
      </div>
    </Card>
  );
}
