import type { User } from "@supabase/supabase-js";
import type { createAuthServerComponentClient } from "../auth/server";
import { resolveAuthorizationContext } from "../auth/authorization";
import type { NotificationPreferencesRecord } from "../communication/contracts";
import { getNotificationPreferencesForUser } from "../communication/server";
import { getOrganizationsForUser } from "../organization/server";
import type {
  OwnerSettingsAbout,
  OwnerSettingsProfile,
  OwnerSettingsSecurity
} from "./settings-shared";

export type {
  OwnerSettingsAbout,
  OwnerSettingsProfile,
  OwnerSettingsSecurity
} from "./settings-shared";

type SupabaseClient = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export type OwnerSettingsExperienceModel = {
  profile: OwnerSettingsProfile;
  security: OwnerSettingsSecurity;
  notificationPreferences: NotificationPreferencesRecord | null;
  notificationPreferencesAvailable: boolean;
  notificationPreferencesNote: string | null;
  about: OwnerSettingsAbout;
};

const ROLE_LABELS: Record<string, string> = {
  property_owner: "Property Owner",
  property_manager: "Property Manager",
  tenant: "Resident",
  vendor: "Vendor"
};

function formatRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

function formatDateTimeLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

/**
 * OWNER-001 Phase 8 — current-user settings only.
 * No org admin, billing, team, or preference schema inventiveness.
 */
export async function loadOwnerSettingsExperience(input: {
  user: User;
  organizationId: string;
  supabase: SupabaseClient;
}): Promise<OwnerSettingsExperienceModel> {
  const { user, organizationId, supabase } = input;

  const [authorization, organizations, profileResult, preferencesResult, userPrefsResult] =
    await Promise.all([
      resolveAuthorizationContext(user, organizationId),
      getOrganizationsForUser(user.id),
      supabase
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle(),
      (async (): Promise<
        | { ok: true; data: NotificationPreferencesRecord | null }
        | { ok: false; error: string }
      > => {
        try {
          return {
            ok: true,
            data: await getNotificationPreferencesForUser(organizationId, user.id, supabase)
          };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Unable to load notification preferences."
          };
        }
      })(),
      supabase.from("user_preferences").select("timezone").eq("user_id", user.id).maybeSingle()
    ]);

  const activeOrganization = organizations.find((org) => org.id === organizationId);
  const roleLabels = (authorization.roles ?? [])
    .map((role) => formatRoleLabel(role))
    .filter((label, index, list) => list.indexOf(label) === index);

  const profile: OwnerSettingsProfile = {
    displayName:
      profileResult.data?.display_name?.trim() ||
      (typeof user.user_metadata?.["full_name"] === "string"
        ? user.user_metadata["full_name"]
        : "") ||
      user.email?.split("@")[0] ||
      "Owner",
    email: user.email ?? "—",
    organizationName: activeOrganization?.name ?? "Organization",
    roleLabels: roleLabels.length > 0 ? roleLabels : ["Property Owner"],
    timezone: userPrefsResult.data?.timezone ?? "UTC",
    languageCode: preferencesResult.ok ? (preferencesResult.data?.languageCode ?? null) : null
  };

  const security: OwnerSettingsSecurity = {
    lastSignInLabel: formatDateTimeLabel(user.last_sign_in_at),
    mfaStatusLabel:
      "Multi-factor authentication is managed through your sign-in provider when enrolled. No MFA enrollment UI ships in Owner Settings.",
    passwordChangeHref: "/forgot-password",
    profileEditHref: "/profile"
  };

  let notificationPreferences: NotificationPreferencesRecord | null = null;
  let notificationPreferencesAvailable = false;
  let notificationPreferencesNote: string | null = null;

  if (!preferencesResult.ok) {
    notificationPreferencesNote =
      "Notification preferences could not be loaded right now. Try again in a moment, or contact your property manager if this continues.";
  } else if (preferencesResult.data == null) {
    notificationPreferencesAvailable = true;
    notificationPreferences = null;
    notificationPreferencesNote =
      "No saved preferences yet. Defaults below use the existing notification preference service — saving creates your personal preferences for this organization.";
  } else {
    notificationPreferencesAvailable = true;
    notificationPreferences = preferencesResult.data;
  }

  const about: OwnerSettingsAbout = {
    mpaVersion: "1.0.0",
    portalVersion: "OWNER-001",
    helpLinks: [
      {
        href: "/profile",
        label: "Profile & contact details",
        description: "Update your name, photo, phone, and timezone on the shared profile surface."
      },
      {
        href: "/portal/owner",
        label: "Owner Dashboard",
        description: "Return to portfolio performance and attention items."
      },
      {
        href: "/forgot-password",
        label: "Password reset",
        description: "Use the existing secure password recovery flow."
      }
    ]
  };

  return {
    profile,
    security,
    notificationPreferences,
    notificationPreferencesAvailable,
    notificationPreferencesNote,
    about
  };
}
