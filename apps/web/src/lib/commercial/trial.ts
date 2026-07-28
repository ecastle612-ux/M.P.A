/**
 * COM-001 Slice B — trial lifecycle (reminders · grace · BILL-001 convert).
 * Clock default: Payment Successful / trial_ends_at from BILL-001 subscription.
 */
import { createServiceRoleServerClient } from "../auth/server";
import { createSaasPortalSession, getOrgSaasSnapshot } from "../saas/server";
import { trialDaysRemaining } from "../saas/plan-display";
import { emitCommercialOpsEvent } from "./ops-events";
import {
  TRIAL_DURATION_DAYS,
  TRIAL_GRACE_DAYS,
  TRIAL_REMINDER_KEYS,
  type TrialLifecycleSnapshot,
  type TrialReminderKey,
  type TrialStatus
} from "./progress-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Trial lifecycle requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

function daysBetween(fromIso: string, toMs: number): number {
  const from = new Date(fromIso).getTime();
  if (!Number.isFinite(from)) return 0;
  return Math.floor((toMs - from) / 86_400_000);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function parseReminders(raw: unknown): Partial<Record<TrialReminderKey, string>> {
  if (!raw || typeof raw !== "object") return {};
  const out: Partial<Record<TrialReminderKey, string>> = {};
  for (const key of TRIAL_REMINDER_KEYS) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

function mapRow(
  row: Record<string, unknown>,
  extras: {
    daysRemaining: number | null;
    graceDaysRemaining: number | null;
    dueReminders: TrialReminderKey[];
    convertVia: TrialLifecycleSnapshot["convertVia"];
    featureRestricted: boolean;
  }
): TrialLifecycleSnapshot {
  return {
    organizationId: String(row["organization_id"]),
    status: String(row["status"] ?? "not_trial") as TrialStatus,
    clockStartedAt: row["clock_started_at"] != null ? String(row["clock_started_at"]) : null,
    trialEndsAt: row["trial_ends_at"] != null ? String(row["trial_ends_at"]) : null,
    graceEndsAt: row["grace_ends_at"] != null ? String(row["grace_ends_at"]) : null,
    daysRemaining: extras.daysRemaining,
    graceDaysRemaining: extras.graceDaysRemaining,
    remindersEmitted: parseReminders(row["reminders_emitted"]),
    convertedAt: row["converted_at"] != null ? String(row["converted_at"]) : null,
    watermarkPolicy:
      row["watermark_policy"] === "none" ? "none" : "pm_ui_badge",
    dueReminders: extras.dueReminders,
    convertVia: extras.convertVia,
    featureRestricted: extras.featureRestricted
  };
}

function computeDueReminders(input: {
  status: TrialStatus;
  clockStartedAt: string | null;
  trialEndsAt: string | null;
  reminders: Partial<Record<TrialReminderKey, string>>;
  now: number;
}): TrialReminderKey[] {
  const due: TrialReminderKey[] = [];
  if (input.status !== "trial_active" && input.status !== "trial_grace") return due;
  if (!input.clockStartedAt || !input.trialEndsAt) return due;

  const elapsed = daysBetween(input.clockStartedAt, input.now);
  const remaining = trialDaysRemaining(input.trialEndsAt);

  const mark = (key: TrialReminderKey, condition: boolean) => {
    if (condition && !input.reminders[key]) due.push(key);
  };

  mark("day0", elapsed >= 0);
  mark("day3", elapsed >= 3);
  mark("day7", elapsed >= 7);
  mark("t3", remaining != null && remaining <= 3 && remaining > 1);
  mark("t1", remaining != null && remaining <= 1 && remaining > 0);
  mark("expiry", remaining === 0 || input.status === "trial_grace");
  mark("grace", input.status === "trial_grace");
  return due;
}

/**
 * Refresh trial state from BILL-001 subscription facts + grace overlay.
 */
export async function refreshTrialLifecycle(
  organizationId: string,
  options?: { actorUserId?: string | null | undefined; emitReminders?: boolean | undefined }
): Promise<TrialLifecycleSnapshot> {
  const admin = serviceClient();
  const snapshot = await getOrgSaasSnapshot(organizationId);
  const sub = snapshot.subscription;
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const { data: existing } = await admin
    .from("commercial_trial_states")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const reminders = parseReminders(existing?.reminders_emitted);
  let status: TrialStatus = "not_trial";
  let clockStartedAt: string | null = existing?.clock_started_at
    ? String(existing.clock_started_at)
    : null;
  let trialEndsAt: string | null = null;
  let graceEndsAt: string | null = null;
  let convertedAt: string | null = existing?.converted_at
    ? String(existing.converted_at)
    : null;

  const planIsTrial = sub?.planCode === "trial";
  const statusTrialing = sub?.status === "trialing";
  const statusPaid =
    sub != null &&
    ["active", "past_due"].includes(sub.status) &&
    sub.planCode !== "trial";

  if (statusPaid) {
    status = "converted";
    convertedAt = convertedAt ?? nowIso;
    trialEndsAt = sub.trialEndsAt;
    clockStartedAt = clockStartedAt ?? sub.trialEndsAt ?? nowIso;
  } else if (planIsTrial || statusTrialing) {
    trialEndsAt =
      sub?.trialEndsAt ??
      (existing?.trial_ends_at ? String(existing.trial_ends_at) : null);
    if (!trialEndsAt) {
      trialEndsAt = addDays(nowIso, TRIAL_DURATION_DAYS);
    }
    if (!clockStartedAt) {
      // Default clock: Payment Successful / trial window start = trial_ends − 14d
      clockStartedAt = addDays(trialEndsAt, -TRIAL_DURATION_DAYS);
    }
    graceEndsAt = addDays(trialEndsAt, TRIAL_GRACE_DAYS);
    const endMs = new Date(trialEndsAt).getTime();
    const graceMs = new Date(graceEndsAt).getTime();
    if (now <= endMs) {
      status = "trial_active";
    } else if (now <= graceMs) {
      status = "trial_grace";
    } else {
      status = "expired_cancelled";
    }
  } else if (existing && String(existing.status) === "converted") {
    status = "converted";
  }

  const previousStatus = existing ? String(existing.status) : null;

  const { data, error } = await admin
    .from("commercial_trial_states")
    .upsert(
      {
        organization_id: organizationId,
        status,
        clock_started_at: clockStartedAt,
        trial_ends_at: trialEndsAt,
        grace_ends_at: graceEndsAt,
        reminders_emitted: reminders,
        converted_at: convertedAt,
        watermark_policy: existing?.watermark_policy ?? "pm_ui_badge"
      },
      { onConflict: "organization_id" }
    )
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to persist trial state");

  if (previousStatus && previousStatus !== status) {
    await emitCommercialOpsEvent({
      eventType: "commercial.trial.status_changed",
      organizationId,
      subjectType: "organization",
      subjectId: organizationId,
      actorUserId: options?.actorUserId,
      summary: `Trial status ${previousStatus} → ${status}`,
      payload: {
        fromStatus: previousStatus,
        toStatus: status
      }
    });
  }

  const dueReminders = computeDueReminders({
    status,
    clockStartedAt,
    trialEndsAt,
    reminders,
    now
  });

  if (options?.emitReminders !== false && dueReminders.length > 0) {
    const nextReminders = { ...reminders };
    for (const key of dueReminders) {
      nextReminders[key] = nowIso;
      await emitCommercialOpsEvent({
        eventType: "commercial.trial.reminder_due",
        organizationId,
        subjectType: "organization",
        subjectId: organizationId,
        actorUserId: options?.actorUserId,
        summary: `Trial reminder ${key}`,
        payload: { reminderKey: key, trialStatus: status }
      });
    }
    await admin
      .from("commercial_trial_states")
      .update({ reminders_emitted: nextReminders })
      .eq("organization_id", organizationId);
    Object.assign(reminders, nextReminders);
  }

  const daysRemaining = trialEndsAt ? trialDaysRemaining(trialEndsAt) : null;
  const graceDaysRemaining =
    graceEndsAt && status === "trial_grace" ? trialDaysRemaining(graceEndsAt) : null;

  const convertVia: TrialLifecycleSnapshot["convertVia"] =
    status === "trial_active" || status === "trial_grace"
      ? sub
        ? "billing_portal"
        : "checkout"
      : "none";

  return mapRow(
    { ...data, reminders_emitted: reminders } as Record<string, unknown>,
    {
      daysRemaining,
      graceDaysRemaining,
      dueReminders,
      convertVia,
      featureRestricted: status === "trial_grace" || status === "expired_cancelled"
    }
  );
}

export async function getTrialLifecycle(
  organizationId: string,
  options?: { actorUserId?: string | null | undefined; emitReminders?: boolean | undefined }
): Promise<TrialLifecycleSnapshot> {
  return refreshTrialLifecycle(organizationId, options);
}

/**
 * BILL-001 convert path for the same organization (no new org).
 * Prefer Customer Portal when a subscription already exists.
 */
export async function startTrialConversion(input: {
  organizationId: string;
  actorUserId: string;
  returnUrl: string;
}): Promise<{ mode: "portal" | "none"; url: string | null; message: string }> {
  const trial = await refreshTrialLifecycle(input.organizationId, {
    actorUserId: input.actorUserId,
    emitReminders: false
  });

  if (trial.status === "converted") {
    return { mode: "none", url: null, message: "Organization already converted from trial" };
  }
  if (trial.status === "not_trial") {
    return { mode: "none", url: null, message: "Organization is not on a trial" };
  }
  if (trial.status === "expired_cancelled") {
    return {
      mode: "none",
      url: null,
      message: "Trial grace ended; use billing reactivation / sales-assisted path"
    };
  }

  const portal = await createSaasPortalSession(
    input.organizationId,
    input.actorUserId,
    input.returnUrl
  );

  await emitCommercialOpsEvent({
    eventType: "commercial.trial.convert_started",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId,
    summary: "Trial convert started via BILL-001 portal",
    payload: { mode: "billing_portal", trialStatus: trial.status }
  });

  return {
    mode: "portal",
    url: portal.url,
    message: "Continue in Stripe Customer Portal to attach payment and upgrade"
  };
}

/** Pure helper — which reminder keys are due (unit tests). */
export function reminderKeysDue(input: {
  status: TrialStatus;
  clockStartedAt: string;
  trialEndsAt: string;
  reminders: Partial<Record<TrialReminderKey, string>>;
  nowMs: number;
}): TrialReminderKey[] {
  return computeDueReminders({
    status: input.status,
    clockStartedAt: input.clockStartedAt,
    trialEndsAt: input.trialEndsAt,
    reminders: input.reminders,
    now: input.nowMs
  });
}
