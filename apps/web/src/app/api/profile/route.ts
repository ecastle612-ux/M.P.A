import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { createAuthServerClient } from "../../../lib/auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../lib/organization/contracts";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  parseNotificationPreferences,
  parseProfileUpdateInput,
  toNotificationPreferencesJson
} from "../../../lib/profile/contracts";

export async function GET() {
  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;

  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (activeOrganizationId) {
    const authorization = await resolveAuthorizationContext(user, activeOrganizationId);
    if (!evaluatePermission(authorization, "profile:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const [profileResponse, preferencesResponse, membershipsResponse] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name, avatar_url, phone, contact_email")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_preferences")
      .select("timezone, notification_preferences")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("organization_memberships")
      .select("organization_id, roles, status, organizations(name, slug)")
      .eq("user_id", user.id)
      .eq("status", "active")
  ]);

  if (profileResponse.error || preferencesResponse.error || membershipsResponse.error) {
    return NextResponse.json(
      {
        error:
          profileResponse.error?.message ??
          preferencesResponse.error?.message ??
          membershipsResponse.error?.message ??
          "Unable to load profile"
      },
      { status: 400 }
    );
  }

  const notificationPreferences =
    parseNotificationPreferences(preferencesResponse.data?.notification_preferences) ??
    DEFAULT_NOTIFICATION_PREFERENCES;

  return NextResponse.json({
    profile: {
      email: user.email ?? "",
      displayName: profileResponse.data?.display_name ?? "",
      avatarUrl: profileResponse.data?.avatar_url ?? "",
      phone: profileResponse.data?.phone ?? "",
      contactEmail: profileResponse.data?.contact_email ?? "",
      timezone: preferencesResponse.data?.timezone ?? "UTC",
      notificationPreferences,
      jobTitle: notificationPreferences.jobTitle ?? "",
      memberships: (membershipsResponse.data ?? []).map((membership) => ({
        organizationId: membership.organization_id,
        organizationName: membership.organizations?.name ?? "",
        organizationSlug: membership.organizations?.slug ?? "",
        roles: membership.roles
      }))
    }
  });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const activeOrganizationId = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;

  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  if (activeOrganizationId) {
    const authorization = await resolveAuthorizationContext(user, activeOrganizationId);
    if (!evaluatePermission(authorization, "profile:update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseProfileUpdateInput(payload);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert({
    user_id: user.id,
    display_name: parsed.displayName || null,
    avatar_url: parsed.avatarUrl || null,
    phone: parsed.phone || null,
    contact_email: parsed.contactEmail || null
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { error: preferenceError } = await supabase.from("user_preferences").upsert({
    user_id: user.id,
    timezone: parsed.timezone,
    notification_preferences: toNotificationPreferencesJson(parsed.notificationPreferences)
  });

  if (preferenceError) {
    return NextResponse.json({ error: preferenceError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
