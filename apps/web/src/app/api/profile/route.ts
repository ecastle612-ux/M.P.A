import { NextResponse } from "next/server";
import { createAuthServerClient, createServiceRoleServerClient } from "../../../lib/auth/server";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  parseNotificationPreferences,
  parseProfileUpdateInput,
  toNotificationPreferencesJson
} from "../../../lib/profile/contracts";
import { SIGNED_URL_TTL_SECONDS } from "../../../lib/media/constants";

/**
 * Profile is user-scoped (self only via RLS).
 * Do not gate on organization role permissions — that breaks setup when an
 * active-org cookie is present but the user has no profile:* grants yet.
 */
export async function GET() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const [profileResponse, preferencesResponse, membershipsResponse] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name, avatar_url, avatar_media_asset_id, phone, contact_email")
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

  const avatarMediaAssetId = profileResponse.data?.avatar_media_asset_id ?? null;
  let avatarUrl = "";
  if (avatarMediaAssetId) {
    const service = createServiceRoleServerClient();
    if (service) {
      const { data: asset } = await service
        .from("media_assets")
        .select("storage_bucket, storage_path, status")
        .eq("id", avatarMediaAssetId)
        .maybeSingle();
      if (asset && asset.status !== "deleted") {
        const { data: thumb } = await service
          .from("media_asset_variants")
          .select("storage_path")
          .eq("media_asset_id", avatarMediaAssetId)
          .eq("variant", "thumb")
          .maybeSingle();
        const path = thumb?.storage_path ?? asset.storage_path;
        const { data: signed } = await service.storage
          .from(asset.storage_bucket)
          .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
        avatarUrl = signed?.signedUrl ?? "";
      }
    }
  }

  return NextResponse.json({
    profile: {
      email: user.email ?? "",
      displayName: profileResponse.data?.display_name ?? "",
      avatarMediaAssetId,
      avatarUrl,
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
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseProfileUpdateInput(payload);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!parsed.displayName.trim()) {
    return NextResponse.json({ error: "Display name is required" }, { status: 400 });
  }

  if (parsed.avatarMediaAssetId) {
    const { data: asset, error: assetError } = await supabase
      .from("media_assets")
      .select("id, owner_user_id, kind, deleted_at")
      .eq("id", parsed.avatarMediaAssetId)
      .maybeSingle();
    if (assetError || !asset || asset.deleted_at || asset.owner_user_id !== user.id || asset.kind !== "profile_photo") {
      return NextResponse.json({ error: "Invalid profile photo" }, { status: 400 });
    }
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      display_name: parsed.displayName.trim(),
      avatar_media_asset_id: parsed.avatarMediaAssetId,
      avatar_url: null,
      phone: parsed.phone || null,
      contact_email: parsed.contactEmail || null
    },
    { onConflict: "user_id" }
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const { error: preferenceError } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      timezone: parsed.timezone,
      notification_preferences: toNotificationPreferencesJson(parsed.notificationPreferences)
    },
    { onConflict: "user_id" }
  );

  if (preferenceError) {
    return NextResponse.json({ error: preferenceError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
