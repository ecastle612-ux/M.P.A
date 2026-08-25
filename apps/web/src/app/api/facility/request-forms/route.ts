import { NextResponse } from "next/server";
import { defaultStandardFieldCatalog } from "@mpa/shared";
import { requireFacilityRequestFormsPermission } from "../../../../lib/facility/authz";
import { createRequestForm, listRequestForms } from "../../../../lib/facility/request-form-service";

export async function GET() {
  const authz = await requireFacilityRequestFormsPermission();
  if ("error" in authz) return authz.error;
  try {
    const forms = await listRequestForms(authz.supabase, authz.organizationId);
    return NextResponse.json({ forms, catalog: defaultStandardFieldCatalog() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load request forms" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityRequestFormsPermission();
  if ("error" in authz) return authz.error;
  const payload = (await request.json().catch(() => null)) as {
    name?: string;
    description?: string;
    instructions?: string;
    accessPolicy?: "contact_required" | "authenticated_only";
    fields?: unknown;
  } | null;
  if (!payload?.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  try {
    const created = await createRequestForm(authz.supabase, authz.organizationId, authz.user.id, {
      name: payload.name,
      ...(payload.description ? { description: payload.description } : {}),
      ...(payload.instructions ? { instructions: payload.instructions } : {}),
      ...(payload.accessPolicy ? { accessPolicy: payload.accessPolicy } : {}),
      fields: Array.isArray(payload.fields) ? (payload.fields as never) : defaultStandardFieldCatalog()
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create request form" },
      { status: 400 }
    );
  }
}
