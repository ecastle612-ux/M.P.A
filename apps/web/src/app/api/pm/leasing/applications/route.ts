import { NextResponse } from "next/server";
import {
  createApplicationInputSchema,
  createProspectInputSchema
} from "@mpa/shared";
import { requireLeasingPermission } from "../../../../../lib/leasing/authz";
import {
  createApplication,
  createProspect,
  getLeasingPipeline,
  listApplications
} from "../../../../../lib/leasing/application-service";

export async function GET(request: Request) {
  const authz = await requireLeasingPermission("pm.leasing:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const url = new URL(request.url);
    if (url.searchParams.get("pipeline") === "1") {
      const pipeline = await getLeasingPipeline(authz.supabase, authz.organizationId);
      return NextResponse.json({ pipeline });
    }
    const applications = await listApplications(authz.supabase, authz.organizationId);
    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list applications" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireLeasingPermission("pm.leasing:write");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const kind = payload && typeof payload === "object" ? (payload as { kind?: string }).kind : null;

  try {
    if (kind === "prospect") {
      const parsed = createProspectInputSchema.safeParse(payload);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid payload", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const result = await createProspect(
        authz.supabase,
        authz.organizationId,
        authz.user.id,
        parsed.data
      );
      return NextResponse.json(result, { status: 201 });
    }

    const parsed = createApplicationInputSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const result = await createApplication(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create" },
      { status: 400 }
    );
  }
}
