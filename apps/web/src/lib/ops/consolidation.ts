/**
 * OPS-001 Slice B — Smart reminder consolidation hooks (A05).
 * Critical/emergency never digests; non-critical may consolidate by recipient + key.
 */

export type ReminderForConsolidation = {
  reminderId: string;
  organizationId: string;
  recipientPrincipalId: string | null;
  priority: string;
  consolidationKey: string | null;
  title: string | null;
  fireAt: string;
};

export type ConsolidationDigest = {
  organizationId: string;
  recipientPrincipalId: string;
  consolidationKey: string;
  reminderIds: string[];
  title: string;
  body: string;
};

export type ConsolidationPlan = {
  discreteReminderIds: string[];
  digests: ConsolidationDigest[];
};

function isCritical(priority: string): boolean {
  return priority === "emergency" || priority === "high";
}

/**
 * Build consolidation plan for a due batch.
 * - Critical/high → discrete
 * - Same org + recipient + consolidationKey (non-critical, ≥2) → digest
 * - Otherwise → discrete
 */
export function consolidateDueReminders(reminders: ReminderForConsolidation[]): ConsolidationPlan {
  const discreteReminderIds: string[] = [];
  const digestBuckets = new Map<string, ReminderForConsolidation[]>();

  for (const reminder of reminders) {
    if (
      isCritical(reminder.priority) ||
      !reminder.recipientPrincipalId ||
      !reminder.consolidationKey
    ) {
      discreteReminderIds.push(reminder.reminderId);
      continue;
    }
    const key = `${reminder.organizationId}|${reminder.recipientPrincipalId}|${reminder.consolidationKey}`;
    const bucket = digestBuckets.get(key) ?? [];
    bucket.push(reminder);
    digestBuckets.set(key, bucket);
  }

  const digests: ConsolidationDigest[] = [];
  for (const [key, bucket] of digestBuckets) {
    if (bucket.length < 2) {
      for (const item of bucket) discreteReminderIds.push(item.reminderId);
      continue;
    }
    const [orgId, recipientId, consolidationKey] = key.split("|");
    digests.push({
      organizationId: orgId!,
      recipientPrincipalId: recipientId!,
      consolidationKey: consolidationKey!,
      reminderIds: bucket.map((b) => b.reminderId),
      title: `${bucket.length} reminders due`,
      body: bucket
        .map((b) => b.title?.trim() || "Reminder")
        .slice(0, 5)
        .join(" · ")
    });
  }

  return { discreteReminderIds, digests };
}
