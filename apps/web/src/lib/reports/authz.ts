import { NextResponse } from "next/server";
import type { ReportCapability } from "@mpa/shared";
import { requireAuthorizedAction } from "../auth/require-authorized-action";

export async function requireReportPermission(
  capability: ReportCapability = "platform.reports:read",
  organizationId?: string
) {
  return requireAuthorizedAction({
    capability,
    entitlement: "platform.reports",
    organizationId
  });
}

export type ReportAuthz = Exclude<
  Awaited<ReturnType<typeof requireReportPermission>>,
  { error: NextResponse }
>;
