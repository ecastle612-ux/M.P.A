import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getNotificationPreferencesForUser, updateNotificationPreferencesForUser } from "../../../../lib/communication/server";
import type { NotificationPreferencesRecord } from "../../../../lib/communication/contracts";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return NextResponse.json({ preferences: null }, { headers: { "Cache-Control": "no-store" } });

    const preferences = await getNotificationPreferencesForUser(organizationId, user.id, supabase);
    return NextResponse.json({ preferences }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;
    const payload = parsedBody.payload as Record<string, unknown>;

    const updates: Partial<
      Pick<
        NotificationPreferencesRecord,
        | "inAppEnabled"
        | "pushEnabled"
        | "emailEnabled"
        | "smsEnabled"
        | "emergencyOverride"
        | "categoryPreferences"
        | "quietHours"
        | "propertyPreferences"
        | "languageCode"
      >
    > = {};
    if (typeof payload["inAppEnabled"] === "boolean") updates.inAppEnabled = payload["inAppEnabled"];
    if (typeof payload["pushEnabled"] === "boolean") updates.pushEnabled = payload["pushEnabled"];
    if (typeof payload["emailEnabled"] === "boolean") updates.emailEnabled = payload["emailEnabled"];
    if (typeof payload["smsEnabled"] === "boolean") updates.smsEnabled = payload["smsEnabled"];
    if (typeof payload["emergencyOverride"] === "boolean") updates.emergencyOverride = payload["emergencyOverride"];
    if (typeof payload["languageCode"] === "string") updates.languageCode = payload["languageCode"];
    if (typeof payload["categoryPreferences"] === "object" && payload["categoryPreferences"] !== null) {
      updates.categoryPreferences = payload["categoryPreferences"] as Record<string, boolean>;
    }
    if (typeof payload["quietHours"] === "object" && payload["quietHours"] !== null) {
      updates.quietHours = payload["quietHours"] as Record<string, unknown>;
    }
    if (Array.isArray(payload["propertyPreferences"])) {
      updates.propertyPreferences = payload["propertyPreferences"] as NotificationPreferencesRecord["propertyPreferences"];
    }

    const preferences = await updateNotificationPreferencesForUser(organizationId, user.id, updates, supabase);
    return NextResponse.json({ preferences });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update preferences";
    return apiError(400, "PREFERENCES_UPDATE_FAILED", message);
  }
}
