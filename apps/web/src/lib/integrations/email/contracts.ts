export type EmailProviderKey = "noop" | "resend" | string;

export type EmailEnvironment = "development" | "staging" | "production" | "test";

export const EMAIL_TEMPLATE_KEYS = [
  "user_invitation",
  "password_reset",
  "welcome_email",
  "maintenance_notification",
  "announcement_email",
  "owner_statement",
  "financial_report",
  "general_notification"
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export type SendEmailInput = {
  organizationId: string;
  idempotencyKey: string;
  templateKey: EmailTemplateKey;
  to: { email: string; name?: string | null };
  subject: string;
  html: string;
  text?: string | null;
  replyTo?: string | null;
  correlation?: {
    notificationId?: string | null;
    sourceEntityType?: string | null;
    sourceEntityId?: string | null;
  };
  tags?: Record<string, string>;
};

export type SendEmailResult = {
  status: "sent" | "queued" | "skipped" | "failed";
  providerKey: EmailProviderKey;
  externalId?: string | null;
  requestId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  rawSafe?: Record<string, unknown>;
};

export type EmailHealthResult = {
  ok: boolean;
  providerKey: EmailProviderKey;
  detail?: string;
  verifiedDomain?: boolean | null;
  domainName?: string | null;
  lastSuccessAt?: string | null;
  lastFailureAt?: string | null;
  lastFailureMessage?: string | null;
  lastDeliveryAt?: string | null;
};

export type EmailConfigValidation = {
  valid: boolean;
  missing: string[];
  warnings: string[];
};

export interface EmailProvider {
  readonly key: EmailProviderKey;
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
  health(): Promise<EmailHealthResult>;
  validateConfiguration(): Promise<EmailConfigValidation>;
}
