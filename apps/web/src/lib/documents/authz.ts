import type { NextResponse } from "next/server";
import {
  WORKSPACE_MANAGER_ROLES,
  WORKSPACE_STAFF_ROLES,
  type DocumentCapability
} from "@mpa/shared";
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

export async function requireWorkspaceRead(organizationId?: string) {
  return requireAuthorizedAction({
    capability: "platform.documents:read",
    entitlement: "platform.documents",
    organizationId,
    allowedRoles: WORKSPACE_STAFF_ROLES
  });
}

export async function requireWorkspaceWrite(organizationId?: string) {
  return requireAuthorizedAction({
    capability: "platform.documents:write",
    entitlement: "platform.documents",
    organizationId,
    allowedRoles: WORKSPACE_MANAGER_ROLES
  });
}

export type DocumentAuthz = Exclude<
  Awaited<ReturnType<typeof requireDocumentPermission>>,
  { error: NextResponse }
>;
