import { NextResponse } from "next/server";
import { isUserRole, type UserRole } from "@mpa/shared";
import { createAuthServerClient } from "../../../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../../../../../lib/master-admin/access";
import {
  assignMembershipRoles,
  setMembershipStatus
} from "../../../../../../../lib/auth/roles/assignment";
import { assertOrganizationPropertyIds } from "../../../../../../../lib/auth/roles/property-scope";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ organizationId: string; userId: string }> }
) {
  const { organizationId, userId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const authz = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authz, "membership:update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const actorIsMasterAdmin = await userHasMasterAdminCapability(user);

  try {
    if (typeof body["status"] === "string" && (body["status"] === "active" || body["status"] === "inactive")) {
      if (!Array.isArray(body["roles"])) {
        const result = await setMembershipStatus({
          organizationId,
          targetUserId: userId,
          status: body["status"],
          actorUserId: user.id,
          actorIsMasterAdmin
        });
        return NextResponse.json({ membership: result });
      }
    }

    const rolesRaw = Array.isArray(body["roles"]) ? body["roles"] : null;
    if (!rolesRaw) {
      return NextResponse.json({ error: "roles array required" }, { status: 400 });
    }

    const roles = rolesRaw.filter((role): role is UserRole => isUserRole(role));
    if (roles.length === 0) {
      return NextResponse.json({ error: "At least one valid role is required" }, { status: 400 });
    }

    const propertyIdsRaw = Array.isArray(body["propertyIds"])
      ? body["propertyIds"].filter((id): id is string => typeof id === "string")
      : undefined;

    const propertyIds =
      propertyIdsRaw !== undefined
        ? await assertOrganizationPropertyIds({
            organizationId,
            propertyIds: propertyIdsRaw
          })
        : undefined;

    const status =
      body["status"] === "active" || body["status"] === "inactive" ? body["status"] : undefined;

    const result = await assignMembershipRoles({
      organizationId,
      targetUserId: userId,
      roles,
      actorUserId: user.id,
      actorIsMasterAdmin,
      ...(propertyIds !== undefined ? { propertyIds } : {}),
      ...(status !== undefined ? { status } : {})
    });

    return NextResponse.json({ membership: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Role assignment failed";
    const status =
      message.startsWith("Forbidden") ||
      message.includes("self-elevate") ||
      message.includes("Only Organization")
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
