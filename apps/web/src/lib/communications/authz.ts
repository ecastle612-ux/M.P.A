import type { NextResponse } from "next/server";
import type { CommunicationsCapability } from "@mpa/shared";
import { requireAuthorizedAction } from "../auth/require-authorized-action";

export async function requireCommunicationsPermission(
  capability: CommunicationsCapability,
  organizationId?: string
) {
  return requireAuthorizedAction({
    capability,
    entitlement: "platform.communications",
    organizationId
  });
}

export type CommunicationsAuthz = Exclude<
  Awaited<ReturnType<typeof requireCommunicationsPermission>>,
  { error: NextResponse }
>;
