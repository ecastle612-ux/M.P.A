import { NextResponse } from "next/server";
import { createPartInputSchema } from "@mpa/shared";
import { requireFacilityPermission } from "../../../../lib/facility/authz";
import {
  buildInventoryAssistant,
  createPart,
  listInventoryStock,
  listPartCategories,
  listParts,
  summarizeInventory
} from "../../../../lib/facility/inventory-service";

export async function GET() {
  const authz = await requireFacilityPermission("facility.parts:read");
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const [parts, categories, stock] = await Promise.all([
      listParts(authz.supabase, authz.organizationId),
      listPartCategories(authz.supabase, authz.organizationId),
      listInventoryStock(authz.supabase, authz.organizationId)
    ]);
    const summary = summarizeInventory(stock);
    return NextResponse.json({
      parts,
      categories,
      assistantRecommendation: buildInventoryAssistant({
        ...summary,
        partCount: parts.length
      })
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load parts" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFacilityPermission("facility.parts:write");
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const body = createPartInputSchema.parse(await request.json());
    const part = await createPart(authz.supabase, authz.organizationId, authz.user.id, body);
    return NextResponse.json({ part }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create part" },
      { status: 400 }
    );
  }
}
