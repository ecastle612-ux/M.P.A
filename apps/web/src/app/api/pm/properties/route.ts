import { NextResponse } from "next/server";
import { createPortfolioPropertyInputSchema } from "@mpa/shared";
import { requirePropertyPermission } from "../../../../lib/property/authz";
import {
  createPortfolioProperty,
  listPortfolioProperties
} from "../../../../lib/property/property-service";

export async function GET() {
  const authz = await requirePropertyPermission("pm.properties:read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const properties = await listPortfolioProperties(authz.supabase, authz.organizationId);
    return NextResponse.json({ properties });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list properties" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requirePropertyPermission("pm.properties:write");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createPortfolioPropertyInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await createPortfolioProperty(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      parsed.data
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create property" },
      { status: 400 }
    );
  }
}
