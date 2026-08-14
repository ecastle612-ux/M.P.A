import { NextResponse } from "next/server";
import type { DocumentCapability } from "@mpa/shared";
import { requireAuthorizedAction } from "../auth/require-authorized-action";

export async function requireDocumentPermission(
  capability: DocumentCapability,
  organizationId?: string
) {
  return requireAuthorizedAction({
    capability,
    entitlement: "platform.documents",
    organizationId
  });
}

export type DocumentAuthz = Exclude<
  Awaited<ReturnType<typeof requireDocumentPermission>>,
  { error: NextResponse }
>;
