import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";

/**
 * Org-scoped device enrollment index for Command Center / Ops (managers).
 */
export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json({ devices: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (
      !evaluatePermission(authorization, "notification:read") &&
      !evaluatePermission(authorization, "communication:read")
    ) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

    const { data, error } = await supabase
      .from("resident_devices")
      .select(
        "id, user_id, platform, device_label, external_subscription_id, provider_key, is_active, enrolled_via, updated_at, created_at, metadata"
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    let devices = ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row["id"]),
      userId: String(row["user_id"]),
      platform: String(row["platform"] ?? "web"),
      deviceLabel: (row["device_label"] as string | null) ?? null,
      externalSubscriptionId: (row["external_subscription_id"] as string | null) ?? null,
      providerKey: String(row["provider_key"] ?? "noop"),
      isActive: Boolean(row["is_active"]),
      enrolledVia: String(row["enrolled_via"] ?? "portal"),
      lastRegistrationAt: String(row["updated_at"] ?? row["created_at"]),
      hasSubscription: Boolean(row["external_subscription_id"])
    }));

    if (q) {
      devices = devices.filter((device) => {
        const hay = [
          device.deviceLabel,
          device.platform,
          device.enrolledVia,
          device.providerKey,
          device.isActive ? "active" : "inactive",
          device.hasSubscription ? "subscribed" : "unsubscribed",
          "push",
          "device",
          "registration",
          "subscription"
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q) || q.split(/\s+/).some((term) => hay.includes(term));
      });
    }

    return NextResponse.json({ devices }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
