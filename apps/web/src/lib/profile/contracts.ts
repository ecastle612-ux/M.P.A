import type { Json } from "@mpa/supabase";

export type NotificationPreferences = {
  email: boolean;
  in_app: boolean;
  sms: boolean;
  jobTitle?: string;
};

export type ProfileUpdateInput = {
  displayName: string;
  /** @deprecated Prefer avatarMediaAssetId — never accept pasted image URLs as SoR */
  avatarUrl?: string;
  avatarMediaAssetId: string | null;
  phone: string;
  contactEmail: string;
  timezone: string;
  notificationPreferences: NotificationPreferences;
};

export function parseProfileUpdateInput(payload: unknown): ProfileUpdateInput | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const displayName = typeof value["displayName"] === "string" ? value["displayName"].trim() : "";
  const phone = typeof value["phone"] === "string" ? value["phone"].trim() : "";
  const contactEmail = typeof value["contactEmail"] === "string" ? value["contactEmail"].trim() : "";
  const timezone = typeof value["timezone"] === "string" ? value["timezone"].trim() : "";
  const notificationPreferences = parseNotificationPreferences(value["notificationPreferences"]);

  let avatarMediaAssetId: string | null = null;
  if (typeof value["avatarMediaAssetId"] === "string" && value["avatarMediaAssetId"].trim()) {
    avatarMediaAssetId = value["avatarMediaAssetId"].trim();
  } else if (value["avatarMediaAssetId"] === null) {
    avatarMediaAssetId = null;
  }

  if (!timezone || !notificationPreferences) {
    return null;
  }

  return {
    displayName,
    avatarMediaAssetId,
    phone,
    contactEmail,
    timezone,
    notificationPreferences
  };
}

export function parseNotificationPreferences(value: unknown): NotificationPreferences | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const email = typeof raw["email"] === "boolean" ? raw["email"] : null;
  const inApp = typeof raw["in_app"] === "boolean" ? raw["in_app"] : null;
  const sms = typeof raw["sms"] === "boolean" ? raw["sms"] : null;
  const jobTitleRaw = raw["job_title"] ?? raw["jobTitle"];
  const jobTitle = typeof jobTitleRaw === "string" ? jobTitleRaw.trim() : undefined;
  if (email === null || inApp === null || sms === null) {
    return null;
  }
  return {
    email,
    in_app: inApp,
    sms,
    ...(jobTitle ? { jobTitle } : {})
  };
}

export function toNotificationPreferencesJson(preferences: NotificationPreferences): Json {
  return {
    email: preferences.email,
    in_app: preferences.in_app,
    sms: preferences.sms,
    ...(preferences.jobTitle ? { job_title: preferences.jobTitle } : {})
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: true,
  in_app: true,
  sms: false
};
