import { NextResponse } from "next/server";
import { hasEntitlement, templatesForSku, type ProductSku } from "@mpa/shared";
import { requireWorkspaceRead } from "../../../../../lib/documents/authz";

export const dynamic = "force-dynamic";

function skuFromEntitlements(entitlements: readonly string[]): ProductSku | null {
  const pm = hasEntitlement(entitlements, "pm.maintenance") || hasEntitlement(entitlements, "pm.properties");
  const fo = hasEntitlement(entitlements, "facility.operations") || hasEntitlement(entitlements, "facility.assets");
  if (pm && fo) return "mpa_complete_platform";
  if (fo) return "mpa_facility_operations";
  if (pm) return "mpa_property_manager";
  return null;
}

export async function GET() {
  const authz = await requireWorkspaceRead();
  if ("error" in authz) {
    return authz.error;
  }
  const templates = templatesForSku(skuFromEntitlements(authz.entitlements)).map((template) => ({
    id: template.id,
    title: template.title,
    description: template.description,
    category: template.category,
    surface: template.surface
  }));
  return NextResponse.json({ templates });
}
