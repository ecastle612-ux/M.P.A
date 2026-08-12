import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  parseNotificationPreferences,
  type NotificationPreferences
} from "./contracts";

type PrefsClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string
      ) => {
        maybeSingle: () => Promise<{
          data: { notification_preferences?: unknown } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

/** Load stored delivery preferences; defaults when missing. SMS is never treated as available. */
export async function loadNotificationPreferences(
  supabase: PrefsClient,
  userId: string
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("notification_preferences")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, sms: false };
  }

  const parsed = parseNotificationPreferences(data.notification_preferences);
  if (!parsed) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, sms: false };
  }
  return { ...parsed, sms: false };
}

export function notificationPreferenceSummaryCopy(): string {
  return "Email and in-app alerts for work and messages. SMS delivery is not available.";
}
