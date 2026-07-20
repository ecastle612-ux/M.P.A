import type { NotificationCategory, NotificationPriority } from "./contracts";

export type QuietHours = {
  enabled: boolean;
  timezone?: string;
  startLocal: string;
  endLocal: string;
  daysOfWeek?: number[];
};

export type ChannelPreference = {
  inApp: boolean;
  push: boolean;
  email?: boolean;
  sms?: boolean;
};

export type PropertyPreference = {
  propertyId: string;
  muted: boolean;
  allowedCategories?: NotificationCategory[];
};

export type EvaluatedPreferences = {
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  emergencyOverride: boolean;
  categoryPreferences: Record<string, boolean | ChannelPreference>;
  quietHours: QuietHours;
  propertyPreferences: PropertyPreference[];
};

export type ChannelDecision = {
  inApp: boolean;
  push: boolean;
  email: boolean;
  reasons: string[];
};

const DEFAULT_QUIET_HOURS: QuietHours = {
  enabled: false,
  startLocal: "22:00",
  endLocal: "07:00"
};

export function parseQuietHours(value: unknown): QuietHours {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...DEFAULT_QUIET_HOURS };
  const record = value as Record<string, unknown>;
  const quietHours: QuietHours = {
    enabled: Boolean(record["enabled"]),
    startLocal:
      typeof record["startLocal"] === "string" ? record["startLocal"] : DEFAULT_QUIET_HOURS.startLocal,
    endLocal: typeof record["endLocal"] === "string" ? record["endLocal"] : DEFAULT_QUIET_HOURS.endLocal
  };
  if (typeof record["timezone"] === "string") quietHours.timezone = record["timezone"];
  if (Array.isArray(record["daysOfWeek"])) {
    quietHours.daysOfWeek = record["daysOfWeek"].filter((d): d is number => typeof d === "number");
  }
  return quietHours;
}

export function parsePropertyPreferences(value: unknown): PropertyPreference[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => {
      const preference: PropertyPreference = {
        propertyId: String(entry["propertyId"] ?? ""),
        muted: Boolean(entry["muted"])
      };
      if (Array.isArray(entry["allowedCategories"])) {
        preference.allowedCategories = entry["allowedCategories"] as NotificationCategory[];
      }
      return preference;
    })
    .filter((entry) => entry.propertyId.length > 0);
}

function parseLocalMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function isWithinQuietHours(quietHours: QuietHours, now = new Date()): boolean {
  if (!quietHours.enabled) return false;
  const start = parseLocalMinutes(quietHours.startLocal);
  const end = parseLocalMinutes(quietHours.endLocal);
  if (start === null || end === null) return false;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: quietHours.timezone || "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short"
  });
  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = dayMap[weekday] ?? now.getUTCDay();
  if (quietHours.daysOfWeek && quietHours.daysOfWeek.length > 0 && !quietHours.daysOfWeek.includes(day)) {
    return false;
  }

  const current = hour * 60 + minute;
  if (start === end) return true;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

function categoryAllows(
  prefs: EvaluatedPreferences,
  category: NotificationCategory,
  channel: "inApp" | "push" | "email"
): boolean {
  const raw = prefs.categoryPreferences[category];
  if (raw === undefined) return true;
  if (typeof raw === "boolean") return raw;
  if (channel === "email") {
    return raw.email === undefined ? true : Boolean(raw.email);
  }
  return Boolean(raw[channel]);
}

export function evaluateDeliveryChannels(input: {
  preferences: EvaluatedPreferences | null;
  category: NotificationCategory;
  priority: NotificationPriority;
  propertyId?: string | null;
  channelOverrides?: { inApp?: boolean; push?: boolean; email?: boolean };
}): ChannelDecision {
  const reasons: string[] = [];
  const prefs = input.preferences;
  const isEmergency = input.priority === "emergency" || input.category === "emergency";

  let inApp = true;
  let push = false;
  let email = true;

  if (!prefs) {
    reasons.push("default_preferences");
    push = isEmergency;
    email = true;
    if (isEmergency) reasons.push("emergency_default_push");
  } else {
    inApp = prefs.inAppEnabled;
    push = prefs.pushEnabled;
    email = prefs.emailEnabled;
    if (!prefs.inAppEnabled) reasons.push("in_app_disabled");
    if (!prefs.pushEnabled) reasons.push("push_disabled");
    if (!prefs.emailEnabled) reasons.push("email_disabled");

    if (input.propertyId) {
      const propertyPref = prefs.propertyPreferences.find((p) => p.propertyId === input.propertyId);
      if (propertyPref?.muted && !isEmergency) {
        inApp = false;
        push = false;
        email = false;
        reasons.push("property_muted");
      } else if (
        propertyPref?.allowedCategories &&
        !propertyPref.allowedCategories.includes(input.category) &&
        !isEmergency
      ) {
        inApp = false;
        push = false;
        email = false;
        reasons.push("property_category_filtered");
      }
    }

    if (isEmergency) {
      if (prefs.inAppEnabled) inApp = true;
      if (prefs.pushEnabled && prefs.emergencyOverride !== false) {
        push = true;
        reasons.push("emergency_override");
      }
      if (prefs.emailEnabled && prefs.emergencyOverride !== false) {
        email = true;
        reasons.push("emergency_email");
      }
    } else {
      if (!categoryAllows(prefs, input.category, "inApp")) {
        inApp = false;
        reasons.push("category_in_app_disabled");
      }
      if (!categoryAllows(prefs, input.category, "push")) {
        push = false;
        reasons.push("category_push_disabled");
      }
      if (!categoryAllows(prefs, input.category, "email")) {
        email = false;
        reasons.push("category_email_disabled");
      }
      if (push && isWithinQuietHours(prefs.quietHours)) {
        push = false;
        reasons.push("quiet_hours");
      }
    }
  }

  if (input.channelOverrides?.inApp !== undefined) inApp = input.channelOverrides.inApp;
  if (input.channelOverrides?.push !== undefined) push = input.channelOverrides.push;
  if (input.channelOverrides?.email !== undefined) email = input.channelOverrides.email;

  return { inApp, push, email, reasons };
}
