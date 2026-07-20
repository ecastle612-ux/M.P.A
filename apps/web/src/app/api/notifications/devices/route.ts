import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { deactivatePushDevice, upsertPushDevice } from "../../../../lib/notifications/devices";
import {
  ensurePreferencesAfterPushEnroll,
  listDevicesForUser,
  userHasActivePushDevice
} from "../../../../lib/notifications/enrollment";
import { apiError, apiInternalError } from "../../../../lib/api/http";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json(
        { hasActiveDevice: false, devices: [] },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "notification:read") && !evaluatePermission(authorization, "notification:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const [devices, hasActiveDevice] = await Promise.all([
      listDevicesForUser(organizationId, user.id, supabase),
      userHasActivePushDevice(organizationId, user.id, supabase)
    ]);

    return NextResponse.json(
      { hasActiveDevice, devices },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "notification:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const body = await request.json().catch(() => null);
    if (!isRecord(body) || typeof body["externalSubscriptionId"] !== "string" || !body["externalSubscriptionId"].trim()) {
      return apiError(400, "INVALID_INPUT", "externalSubscriptionId is required");
    }

    const platformRaw = body["platform"];
    const platform =
      platformRaw === "ios" || platformRaw === "android" || platformRaw === "unknown" ? platformRaw : "web";

    const enrolledViaRaw = body["enrolledVia"];
    const enrolledVia =
      enrolledViaRaw === "qr" ||
      enrolledViaRaw === "manual" ||
      enrolledViaRaw === "pwa" ||
      enrolledViaRaw === "onboarding_banner" ||
      enrolledViaRaw === "settings" ||
      enrolledViaRaw === "qr_join"
        ? enrolledViaRaw
        : "portal";

    const device = await upsertPushDevice({
      organizationId,
      userId: user.id,
      propertyId: typeof body["propertyId"] === "string" ? body["propertyId"] : null,
      platform,
      externalSubscriptionId: body["externalSubscriptionId"].trim(),
      deviceLabel: typeof body["deviceLabel"] === "string" ? body["deviceLabel"] : null,
      enrolledVia,
      client: supabase
    });

    await ensurePreferencesAfterPushEnroll(organizationId, user.id, supabase);

    return NextResponse.json({ device }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(400, "DEVICE_REGISTER_FAILED", error instanceof Error ? error.message : "Registration failed");
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "notification:update")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const body = await request.json().catch(() => null);
    if (!isRecord(body) || typeof body["externalSubscriptionId"] !== "string") {
      return apiError(400, "INVALID_INPUT", "externalSubscriptionId is required");
    }

    await deactivatePushDevice({
      organizationId,
      userId: user.id,
      externalSubscriptionId: body["externalSubscriptionId"],
      client: supabase
    });

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
