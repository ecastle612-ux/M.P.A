"use client";

import Link from "next/link";
import { Button, Card } from "@mpa/ui";

export type SmartSuggestion = {
  label: string;
  href: string;
  primary?: boolean;
};

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

export function vacantUnitSuggestions(input: {
  propertyId: string;
  unitId: string;
}): SmartSuggestion[] {
  return [
    {
      label: "Start Move In",
      href: `/residents/move-in?propertyId=${input.propertyId}&unitId=${input.unitId}`,
      primary: true
    },
    {
      label: "Create Lease",
      href: `/leases/new?propertyId=${input.propertyId}&unitId=${input.unitId}`
    },
    {
      label: "Schedule inspection",
      href: `/maintenance/new?propertyId=${input.propertyId}&unitId=${input.unitId}&title=${encodeURIComponent("Unit inspection")}`
    },
    { label: "View property", href: `/properties/${input.propertyId}` }
  ];
}

export function completedWorkOrderSuggestions(input: {
  workOrderId: string;
  propertyId: string;
  unitId?: string | null;
  facilityRecordHref?: string | null;
}): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  if (input.facilityRecordHref) {
    suggestions.push({ label: "View Facility Record", href: input.facilityRecordHref, primary: true });
  }
  suggestions.push(
    {
      label: "Record expense",
      href: `/financials/expenses/new?propertyId=${input.propertyId}`,
      primary: !input.facilityRecordHref
    },
    {
      label: "Notify residents",
      href: `/communications/new?propertyId=${input.propertyId}`
    },
    {
      label: "Open work order",
      href: `/maintenance/${input.workOrderId}`
    }
  );
  if (input.unitId) {
    suggestions.push({
      label: "Unit history",
      href: `/units/${input.unitId}`
    });
  }
  return suggestions;
}

export function lateRentSuggestions(input: {
  tenantId?: string | null;
  propertyId?: string | null;
}): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [
    {
      label: "Record payment",
      href: "/financials/payments/new",
      primary: true
    },
    {
      label: "Review late charges",
      href: "/financials/charges"
    },
    {
      label: "Send reminder",
      href: input.propertyId
        ? `/communications/new?propertyId=${input.propertyId}`
        : "/communications/new"
    }
  ];
  if (input.tenantId) {
    suggestions.push({ label: "Contact resident", href: `/tenants/${input.tenantId}` });
  }
  return suggestions;
}
