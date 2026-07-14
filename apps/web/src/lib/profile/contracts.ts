import type { Json } from "@mpa/supabase";

export type NotificationPreferences = {
  email: boolean;
  in_app: boolean;
  sms: boolean;
};

export type ProfileUpdateInput = {
  displayName: string;
  avatarUrl: string;
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
  const avatarUrl = typeof value["avatarUrl"] === "string" ? value["avatarUrl"].trim() : "";
  const phone = typeof value["phone"] === "string" ? value["phone"].trim() : "";
  const contactEmail = typeof value["contactEmail"] === "string" ? value["contactEmail"].trim() : "";
  const timezone = typeof value["timezone"] === "string" ? value["timezone"].trim() : "";
  const notificationPreferences = parseNotificationPreferences(value["notificationPreferences"]);

  if (!timezone || !notificationPreferences) {
    return null;
  }

  return {
    displayName,
    avatarUrl,
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
  if (email === null || inApp === null || sms === null) {
    return null;
  }
  return { email, in_app: inApp, sms };
}

export function toNotificationPreferencesJson(preferences: NotificationPreferences): Json {
  return {
    email: preferences.email,
    in_app: preferences.in_app,
    sms: preferences.sms
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: true,
  in_app: true,
  sms: false
};
