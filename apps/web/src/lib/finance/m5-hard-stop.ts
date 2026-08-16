import { NextResponse } from "next/server";
import type { FinanceCapability } from "@mpa/shared";

export const FINANCE_M5_COLLECTION_KINDS = [
  "policy",
  "assess_late_fees",
  "sync_delinquency",
  "reminder",
  "arrangement"
] as const;

export type FinanceM5CollectionKind = (typeof FINANCE_M5_COLLECTION_KINDS)[number];

export function isFinanceM5CollectionKind(kind: string | undefined): kind is FinanceM5CollectionKind {
  return FINANCE_M5_COLLECTION_KINDS.includes(kind as FinanceM5CollectionKind);
}

export function financeM5CollectionCapability(kind: FinanceM5CollectionKind): FinanceCapability {
  switch (kind) {
    case "policy":
    case "assess_late_fees":
      return "pm.finance:late_fee.manage";
    case "sync_delinquency":
      return "pm.finance:read";
    case "reminder":
    case "arrangement":
      return "pm.finance:charge.write";
  }
}

export function financeM5NotAuthorizedResponse() {
  return NextResponse.json({ error: "finance_m5_not_authorized" }, { status: 403 });
}
