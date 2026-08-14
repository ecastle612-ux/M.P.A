import type { NextResponse } from "next/server";
import type { FinanceCapability } from "@mpa/shared";
import { requireAuthorizedAction } from "../auth/require-authorized-action";

export async function requireFinancePermission(capability: FinanceCapability, organizationId?: string) {
  return requireAuthorizedAction({
    capability,
    entitlement: "pm.financial_operations",
    organizationId
  });
}

export type FinanceAuthz = Exclude<Awaited<ReturnType<typeof requireFinancePermission>>, { error: NextResponse }>;
