import { NextResponse } from "next/server";
import {
  decideApplicationInputSchema,
  markApplicationIncompleteInputSchema
} from "@mpa/shared";
import { requireLeasingPermission } from "../../../../../../lib/leasing/authz";
import {
  approveApplication,
  denyApplication,
  getApplication,
  markApplicationIncomplete,
  planBackgroundScreening,
  submitApplication
} from "../../../../../../lib/leasing/application-service";

type RouteContext = { params: Promise<{ applicationId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const authz = await requireLeasingPermission("pm.leasing:read");
  if ("error" in authz) {
    return authz.error;
  }
  const { applicationId } = await context.params;
  try {
    const application = await getApplication(authz.supabase, authz.organizationId, applicationId);
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load application" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const authz = await requireLeasingPermission("pm.leasing:write");
  if ("error" in authz) {
    return authz.error;
  }
  const { applicationId } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const action =
    payload && typeof payload === "object" ? (payload as { action?: string }).action : undefined;

  try {
    switch (action) {
      case "submit": {
        const result = await submitApplication(
          authz.supabase,
          authz.organizationId,
          authz.user.id,
          applicationId
        );
        return NextResponse.json(result);
      }
      case "incomplete": {
        const parsed = markApplicationIncompleteInputSchema.safeParse(payload);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid payload", details: parsed.error.flatten() },
            { status: 400 }
          );
        }
        const result = await markApplicationIncomplete(
          authz.supabase,
          authz.organizationId,
          authz.user.id,
          applicationId,
          parsed.data
        );
        return NextResponse.json(result);
      }
      case "screening": {
        const result = await planBackgroundScreening(
          authz.supabase,
          authz.organizationId,
          authz.user.id,
          applicationId
        );
        return NextResponse.json(result);
      }
      case "approve": {
        const parsed = decideApplicationInputSchema.safeParse(payload);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid payload", details: parsed.error.flatten() },
            { status: 400 }
          );
        }
        const result = await approveApplication(
          authz.supabase,
          authz.organizationId,
          authz.user.id,
          applicationId,
          parsed.data
        );
        return NextResponse.json(result);
      }
      case "deny": {
        const parsed = decideApplicationInputSchema.safeParse(payload);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Invalid payload", details: parsed.error.flatten() },
            { status: 400 }
          );
        }
        const result = await denyApplication(
          authz.supabase,
          authz.organizationId,
          authz.user.id,
          applicationId,
          parsed.data
        );
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json(
          {
            error:
              "Unknown action. Use submit | incomplete | screening | approve | deny."
          },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Application action failed" },
      { status: 400 }
    );
  }
}
