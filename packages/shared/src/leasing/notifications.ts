/**
 * Phase 5 Sprint 1 — leasing notification type registration.
 * Keys only; delivery reuses the existing communications / notification engine.
 */

export const LEASING_NOTIFICATION_TYPES = [
  "leasing.application.received",
  "leasing.application.incomplete",
  "leasing.screening.pending",
  "leasing.application.approved",
  "leasing.application.denied",
  "leasing.lease.ready",
  "leasing.lease.signed",
  "leasing.move_in.reminder",
  "leasing.renewal.upcoming"
] as const;

export type LeasingNotificationType = (typeof LEASING_NOTIFICATION_TYPES)[number];

export type LeasingNotificationDefinition = {
  key: LeasingNotificationType;
  label: string;
  defaultChannels: readonly ("in_app" | "email")[];
  audience: readonly ("staff" | "resident" | "owner")[];
};

export const LEASING_NOTIFICATION_CATALOG: readonly LeasingNotificationDefinition[] = [
  {
    key: "leasing.application.received",
    label: "Application received",
    defaultChannels: ["in_app", "email"],
    audience: ["staff"]
  },
  {
    key: "leasing.application.incomplete",
    label: "Application incomplete",
    defaultChannels: ["in_app", "email"],
    audience: ["staff", "resident"]
  },
  {
    key: "leasing.screening.pending",
    label: "Pending screening results",
    defaultChannels: ["in_app"],
    audience: ["staff"]
  },
  {
    key: "leasing.application.approved",
    label: "Application approved",
    defaultChannels: ["in_app", "email"],
    audience: ["staff", "resident"]
  },
  {
    key: "leasing.application.denied",
    label: "Application denied",
    defaultChannels: ["in_app", "email"],
    audience: ["staff", "resident"]
  },
  {
    key: "leasing.lease.ready",
    label: "Lease ready to sign",
    defaultChannels: ["in_app", "email"],
    audience: ["staff", "resident"]
  },
  {
    key: "leasing.lease.signed",
    label: "Lease signed",
    defaultChannels: ["in_app", "email"],
    audience: ["staff", "resident"]
  },
  {
    key: "leasing.move_in.reminder",
    label: "Move-in reminder",
    defaultChannels: ["in_app", "email"],
    audience: ["staff", "resident"]
  },
  {
    key: "leasing.renewal.upcoming",
    label: "Upcoming renewal",
    defaultChannels: ["in_app", "email"],
    audience: ["staff"]
  }
];

export function isLeasingNotificationType(value: string): value is LeasingNotificationType {
  return (LEASING_NOTIFICATION_TYPES as readonly string[]).includes(value);
}
