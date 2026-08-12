import { sendOperationalNoticeEmail } from "../communications/email";
import { loadNotificationPreferences } from "../profile/notification-preferences";

type Db = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => {
      select: (cols: string) => {
        maybeSingle: () => Promise<{
          data: { id: string } | null;
          error: { message: string } | null;
        }>;
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (
        col: string,
        val: string
      ) => Promise<{ error: { message: string } | null }>;
    };
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

export type LifecycleNotifyResult = {
  inApp: boolean;
  notificationId: string | null;
  emailStatus:
    | "skipped_no_user"
    | "skipped_no_email"
    | "skipped_not_configured"
    | "skipped_preference"
    | "sent"
    | "failed"
    | "not_requested";
  emailError?: string;
  emailProviderId?: string;
};

async function resolveUserEmail(userId: string): Promise<string | null> {
  try {
    if (process.env["VITEST"]) return null;
    const { serverEnv } = await import("../env/server-env");
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    const service = createServiceRoleClient();
    const { data, error } = await service.auth.admin.getUserById(userId);
    if (error || !data.user?.email) return null;
    return data.user.email;
  } catch {
    return null;
  }
}

/**
 * STAB-007 — reuse maintenance_notifications; optional Resend with honest delivery status.
 * PPS1-011 — honor stored email / in-app preferences; never SMS.
 */
export async function notifyLifecycle(
  supabase: Db,
  args: {
    organizationId: string;
    userId: string | null | undefined;
    workOrderId: string;
    key: string;
    title: string;
    body: string;
    href: string;
    /** When true, attempt email after in-app insert (still gated by user email preference). */
    emailCritical?: boolean;
  }
): Promise<LifecycleNotifyResult> {
  if (!args.userId) {
    return {
      inApp: false,
      notificationId: null,
      emailStatus: "skipped_no_user"
    };
  }

  const preferences = await loadNotificationPreferences(supabase, args.userId);
  const wantsInApp = preferences.in_app;
  const wantsEmail = Boolean(args.emailCritical) && preferences.email;

  let notificationId: string | null = null;

  if (wantsInApp) {
    const { data, error } = await supabase
      .from("maintenance_notifications")
      .insert({
        organization_id: args.organizationId,
        user_id: args.userId,
        work_order_id: args.workOrderId,
        notification_key: args.key,
        title: args.title,
        body: args.body,
        href: args.href,
        channel: wantsEmail ? "in_app_and_email" : "in_app",
        email_delivery_status: wantsEmail ? "queued" : null
      })
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    notificationId = data?.id ?? null;
  }

  if (!wantsEmail) {
    return {
      inApp: wantsInApp,
      notificationId,
      emailStatus: args.emailCritical
        ? preferences.email
          ? "not_requested"
          : "skipped_preference"
        : "not_requested"
    };
  }

  const email = await resolveUserEmail(args.userId);
  if (!email) {
    if (notificationId) {
      await supabase
        .from("maintenance_notifications")
        .update({
          email_delivery_status: "skipped_no_email",
          email_attempted_at: new Date().toISOString()
        })
        .eq("id", notificationId);
    }
    return {
      inApp: wantsInApp,
      notificationId,
      emailStatus: "skipped_no_email"
    };
  }

  const sendResult = await sendOperationalNoticeEmail({
    to: email,
    subject: args.title,
    body: `${args.body}\n\nOpen: ${args.href}`,
    audienceLabel: "work-order lifecycle"
  });

  const attemptedAt = new Date().toISOString();
  if (sendResult.ok) {
    if (notificationId) {
      await supabase
        .from("maintenance_notifications")
        .update({
          email_delivery_status: "sent",
          email_provider_id: sendResult.providerId,
          email_delivery_error: null,
          email_attempted_at: attemptedAt
        })
        .eq("id", notificationId);
    }
    return {
      inApp: wantsInApp,
      notificationId,
      emailStatus: "sent",
      emailProviderId: sendResult.providerId
    };
  }

  const failedStatus =
    sendResult.error === "Email provider is not configured"
      ? ("skipped_not_configured" as const)
      : ("failed" as const);

  if (notificationId) {
    await supabase
      .from("maintenance_notifications")
      .update({
        email_delivery_status: failedStatus,
        email_delivery_error: sendResult.error.slice(0, 500),
        email_attempted_at: attemptedAt
      })
      .eq("id", notificationId);
  }

  return {
    inApp: wantsInApp,
    notificationId,
    emailStatus: failedStatus,
    emailError: sendResult.error
  };
}

export const CRITICAL_NOTIFICATION_KEYS = new Set([
  "work_order.assigned",
  "vendor.assigned",
  "work_order.started",
  "work_order.completed",
  "work_order.closed",
  "work_order.cancelled",
  "work_order.emergency"
]);
