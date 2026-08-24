import { NextResponse } from "next/server";
import { createWorkTemplateInputSchema, FACILITY_MANAGER_ROLES } from "@mpa/shared";
import { requireAuthorizedAction } from "../../../../lib/auth/require-authorized-action";
import {
  createWorkTemplate,
  listWorkTemplates
} from "../../../../lib/facility/work-template-service";

export const runtime = "nodejs";

async function requireTemplateManager() {
  return requireAuthorizedAction({
    capability: "pm.maintenance:write",
    entitlement: "facility.operations",
    allowedRoles: [...FACILITY_MANAGER_ROLES]
  });
}

export async function GET() {
  const auth = await requireAuthorizedAction({
    capability: "pm.maintenance:read",
    entitlement: "facility.operations"
  });
  if ("error" in auth) return auth.error;

  try {
    const templates = await listWorkTemplates(auth.supabase, auth.organizationId);
    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireTemplateManager();
  if ("error" in auth) return auth.error;

  try {
    const body = createWorkTemplateInputSchema.parse(await request.json());
    const created = await createWorkTemplate(
      auth.supabase,
      auth.organizationId,
      auth.user.id,
      body
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create template" },
      { status: 400 }
    );
  }
}
