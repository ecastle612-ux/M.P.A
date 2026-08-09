export const APPLICATION_EVENT_TYPES = [
  "application.created",
  "application.submitted",
  "application.incomplete",
  "application.screening_planned",
  "application.approved",
  "application.denied",
  "application.withdrawn",
  "prospect.created"
] as const;
export type ApplicationEventType = (typeof APPLICATION_EVENT_TYPES)[number];

export type ApplicationEventDefinition = {
  type: ApplicationEventType;
  aggregateType: string;
  description: string;
  auditAction: string;
  notificationKey?: string;
};

export const APPLICATION_EVENT_CATALOG: readonly ApplicationEventDefinition[] = [
  {
    type: "prospect.created",
    aggregateType: "pm_residents",
    description: "Prospect person record created",
    auditAction: "prospect.created"
  },
  {
    type: "application.created",
    aggregateType: "lease_applications",
    description: "Rental application draft created for an applicant",
    auditAction: "application.created",
    notificationKey: "leasing.application.received"
  },
  {
    type: "application.submitted",
    aggregateType: "lease_applications",
    description: "Application submitted for review",
    auditAction: "application.submitted",
    notificationKey: "leasing.application.received"
  },
  {
    type: "application.incomplete",
    aggregateType: "lease_applications",
    description: "Application marked incomplete",
    auditAction: "application.incomplete",
    notificationKey: "leasing.application.incomplete"
  },
  {
    type: "application.screening_planned",
    aggregateType: "lease_applications",
    description: "Background screening workflow placeholder entered (provider integration planned)",
    auditAction: "application.screening_planned",
    notificationKey: "leasing.screening.pending"
  },
  {
    type: "application.approved",
    aggregateType: "lease_applications",
    description: "Application approved — ready for lease",
    auditAction: "application.approved",
    notificationKey: "leasing.application.approved"
  },
  {
    type: "application.denied",
    aggregateType: "lease_applications",
    description: "Application denied",
    auditAction: "application.denied",
    notificationKey: "leasing.application.denied"
  },
  {
    type: "application.withdrawn",
    aggregateType: "lease_applications",
    description: "Application withdrawn",
    auditAction: "application.withdrawn"
  }
];

export function isApplicationEventType(value: string): value is ApplicationEventType {
  return (APPLICATION_EVENT_TYPES as readonly string[]).includes(value);
}
