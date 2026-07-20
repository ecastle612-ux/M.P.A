/**
 * Signature domain contracts (API-004).
 * Business modules talk only to SignatureService — never provider SDKs.
 */

export const SIGNATURE_PACKAGE_STATUSES = [
  "draft",
  "ready_to_send",
  "sent",
  "in_progress",
  "partially_signed",
  "completed",
  "declined",
  "expired",
  "cancelled",
  "failed",
  "voided",
  "awaiting_vault_sync"
] as const;

export type SignaturePackageStatus = (typeof SIGNATURE_PACKAGE_STATUSES)[number];

export const SIGNATURE_DOCUMENT_TYPES = [
  "lease_agreement",
  "lease_renewal",
  "pet_agreement",
  "parking_agreement",
  "move_in_form",
  "inspection_form",
  "owner_agreement",
  "vendor_agreement",
  "general_pdf",
  "application_consent",
  "addendum",
  "other"
] as const;

export type SignatureDocumentType = (typeof SIGNATURE_DOCUMENT_TYPES)[number];

export const SIGNATURE_RECIPIENT_ROLES = [
  "primary_applicant",
  "co_applicant",
  "guarantor",
  "property_manager",
  "property_owner",
  "witness",
  "cc_viewer"
] as const;

export type SignatureRecipientRole = (typeof SIGNATURE_RECIPIENT_ROLES)[number];

export const SIGNATURE_RECIPIENT_STATUSES = [
  "pending",
  "invited",
  "viewed",
  "signed",
  "declined",
  "expired",
  "skipped"
] as const;

export type SignatureRecipientStatus = (typeof SIGNATURE_RECIPIENT_STATUSES)[number];

export const SIGNATURE_ORDER_MODES = ["sequential", "parallel", "hybrid"] as const;
export type SignatureOrderMode = (typeof SIGNATURE_ORDER_MODES)[number];

export const SIGNATURE_VAULT_STATUSES = [
  "not_required",
  "pending",
  "synced",
  "awaiting_vault_sync",
  "failed"
] as const;

export type SignatureVaultStatus = (typeof SIGNATURE_VAULT_STATUSES)[number];

export type SignatureProviderId =
  | "noop"
  | "dropbox_sign"
  | "docusign"
  | "adobe_sign"
  | "signnow"
  | "pandadoc";

export type SignaturePackageRecord = {
  id: string;
  organizationId: string;
  applicantId: string | null;
  leaseId: string | null;
  propertyId: string | null;
  unitId: string | null;
  tenantId: string | null;
  screeningCaseId: string | null;
  packageNumber: string;
  provider: string;
  documentType: SignatureDocumentType;
  status: SignaturePackageStatus;
  orderMode: SignatureOrderMode;
  subject: string | null;
  message: string | null;
  externalReference: string | null;
  expiresAt: string | null;
  sentAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  signedAt: string | null;
  vaultStatus: SignatureVaultStatus;
  vaultRetryCount: number;
  vaultLastError: string | null;
  residentActivatedAt: string | null;
  certificateVaultDocumentId: string | null;
  lastError: string | null;
  retryCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type SignatureRecipientRecord = {
  id: string;
  organizationId: string;
  signatureRequestId: string;
  role: SignatureRecipientRole;
  fullName: string;
  email: string | null;
  userId: string | null;
  applicantId: string | null;
  tenantId: string | null;
  signingOrder: number;
  signingGroup: number;
  isRequired: boolean;
  authMethod: string;
  status: SignatureRecipientStatus;
  progressToken: string | null;
  signingUrl: string | null;
  externalRecipientId: string | null;
  invitedAt: string | null;
  viewedAt: string | null;
  signedAt: string | null;
  declinedAt: string | null;
  lastReminderAt: string | null;
  reminderCount: number;
  progressUrl: string | null;
};

export type SignaturePackageDocumentRecord = {
  id: string;
  organizationId: string;
  signatureRequestId: string;
  templateId: string | null;
  documentType: string;
  title: string;
  version: number;
  contentHash: string;
  contentText: string;
  isPreview: boolean;
  sortOrder: number;
  vaultDocumentId: string | null;
};

export type SignatureProgressStep = {
  key: string;
  label: string;
  status: "pending" | "active" | "complete" | "failed";
};

export type SignatureOpsSnapshot = {
  pendingSignatures: number;
  completedToday: number;
  expiredRequests: number;
  reminderQueue: number;
  providerFailures: number;
  awaitingVaultSync: number;
  averageCompletionHours: number | null;
};

export type CreateSignaturePackageInput = {
  leaseId?: string | null;
  applicantId?: string | null;
  screeningCaseId?: string | null;
  documentType?: SignatureDocumentType;
  orderMode?: SignatureOrderMode;
  subject?: string;
  message?: string;
  recipients?: Array<{
    role: SignatureRecipientRole;
    fullName: string;
    email?: string | null;
    signingOrder?: number;
    signingGroup?: number;
    isRequired?: boolean;
    applicantId?: string | null;
    tenantId?: string | null;
    userId?: string | null;
  }>;
  provider?: string;
};

export type MergeFieldContext = Record<string, string | number | null | undefined>;

export const DEFAULT_LEASE_TEMPLATE = `RESIDENTIAL LEASE AGREEMENT

Property: {{property_name}}
Address: {{property_address}}
Unit: {{unit_number}}

Landlord / Manager: {{org_name}}
Primary Resident: {{primary_name}}
Email: {{primary_email}}

Lease Start: {{lease_start}}
Lease End: {{lease_end}}
Monthly Rent: {{rent_amount}}
Security Deposit: {{deposit_amount}}

By signing electronically, each party agrees this electronic signature is the legal equivalent of a handwritten signature under applicable ESIGN/UETA laws.

Document generated by M.P.A. — preview and execution controlled inside My Property Assistant.
`;

export const DEFAULT_LEASE_REQUIRED_FIELDS = [
  "property_name",
  "property_address",
  "unit_number",
  "org_name",
  "primary_name",
  "primary_email",
  "lease_start",
  "lease_end",
  "rent_amount",
  "deposit_amount"
];

export function mergeTemplate(template: string, context: MergeFieldContext): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = context[key];
    if (value === null || value === undefined || value === "") return `⟦${key}⟧`;
    return String(value);
  });
}

export function missingMergeFields(template: string, context: MergeFieldContext, required: string[]): string[] {
  const missing: string[] = [];
  for (const field of required) {
    const value = context[field];
    if (value === null || value === undefined || String(value).trim() === "") {
      missing.push(field);
    }
  }
  // Also flag unresolved placeholders after merge
  const merged = mergeTemplate(template, context);
  const unresolved = merged.match(/⟦([a-zA-Z0-9_]+)⟧/g) ?? [];
  for (const token of unresolved) {
    const key = token.slice(1, -1);
    if (!missing.includes(key)) missing.push(key);
  }
  return missing;
}

export function buildProgress(
  pkg: SignaturePackageRecord,
  recipients: SignatureRecipientRecord[]
): SignatureProgressStep[] {
  const required = recipients.filter((r) => r.isRequired && r.role !== "cc_viewer");
  const signed = required.filter((r) => r.status === "signed").length;
  const vaultOk = pkg.vaultStatus === "synced" || pkg.status === "completed";
  return [
    {
      key: "package",
      label: "Package",
      status: ["draft", "ready_to_send"].includes(pkg.status) ? "active" : "complete"
    },
    {
      key: "sent",
      label: "Invitations",
      status: pkg.sentAt ? "complete" : pkg.status === "ready_to_send" ? "active" : "pending"
    },
    {
      key: "signing",
      label: `Signatures (${signed}/${required.length || 0})`,
      status:
        pkg.status === "completed" || pkg.status === "awaiting_vault_sync"
          ? "complete"
          : ["sent", "in_progress", "partially_signed"].includes(pkg.status)
            ? "active"
            : pkg.status === "failed" || pkg.status === "declined"
              ? "failed"
              : "pending"
    },
    {
      key: "vault",
      label: "Vault + certificate",
      status:
        pkg.vaultStatus === "synced"
          ? "complete"
          : pkg.vaultStatus === "awaiting_vault_sync" || pkg.vaultStatus === "failed"
            ? "active"
            : vaultOk
              ? "complete"
              : "pending"
    },
    {
      key: "resident",
      label: "Resident activation",
      status: pkg.residentActivatedAt ? "complete" : pkg.vaultStatus === "synced" ? "active" : "pending"
    }
  ];
}
