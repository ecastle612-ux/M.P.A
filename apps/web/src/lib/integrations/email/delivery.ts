import {
  getRecentIdempotentResult,
  recordEmailAudit,
  rememberIdempotentResult
} from "./audit";
import type { EmailTemplateKey, SendEmailInput, SendEmailResult } from "./contracts";
import { getEmailProvider } from "./registry";
import { invitationEmailContent, renderTransactionalEmail } from "./render";

export type WorkflowEmailInput = {
  organizationId: string;
  templateKey: EmailTemplateKey;
  idempotencyKey: string;
  to: { email: string; name?: string | null };
  subject: string;
  body: string;
  href?: string | null;
  replyTo?: string | null;
  correlation?: {
    notificationId?: string | null;
    sourceEntityType?: string | null;
    sourceEntityId?: string | null;
  };
  tags?: Record<string, string>;
};

/**
 * Sole outbound email entry for workflows. Applies idempotency, audit, and provider send.
 * Password reset must NOT call this — Supabase Auth owns recovery email (ADR-018).
 */
export async function sendWorkflowEmail(input: WorkflowEmailInput): Promise<SendEmailResult> {
  const provider = getEmailProvider();
  const cached = getRecentIdempotentResult(input.idempotencyKey);
  if (cached) {
    return { ...cached, rawSafe: { ...(cached.rawSafe ?? {}), deduplicated: true } };
  }

  if (input.templateKey === "password_reset") {
    const result: SendEmailResult = {
      status: "skipped",
      providerKey: provider.key,
      errorCode: "password_reset_via_supabase_auth",
      errorMessage: "Password reset remains Supabase Auth (ADR-018 / INT-303 non-goal)"
    };
    recordEmailAudit({
      organizationId: input.organizationId,
      providerKey: provider.key,
      templateKey: input.templateKey,
      idempotencyKey: input.idempotencyKey,
      recipientEmail: input.to.email,
      result,
      ...(input.correlation ? { correlation: input.correlation } : {})
    });
    rememberIdempotentResult(input.idempotencyKey, result);
    return result;
  }

  const rendered = renderTransactionalEmail({
    templateKey: input.templateKey,
    subject: input.subject,
    body: input.body,
    href: input.href ?? null,
    recipientName: input.to.name ?? null
  });

  const sendInput: SendEmailInput = {
    organizationId: input.organizationId,
    idempotencyKey: input.idempotencyKey,
    templateKey: input.templateKey,
    to: input.to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tags: {
      template: input.templateKey,
      organization_id: input.organizationId,
      ...(input.tags ?? {})
    }
  };
  if (input.replyTo !== undefined) sendInput.replyTo = input.replyTo;
  if (input.correlation !== undefined) sendInput.correlation = input.correlation;

  const result = await provider.sendEmail(sendInput);

  recordEmailAudit({
    organizationId: input.organizationId,
    providerKey: result.providerKey,
    templateKey: input.templateKey,
    idempotencyKey: input.idempotencyKey,
    recipientEmail: input.to.email,
    result,
    ...(input.correlation ? { correlation: input.correlation } : {})
  });
  rememberIdempotentResult(input.idempotencyKey, result);
  return result;
}

export async function sendInvitationEmail(input: {
  organizationId: string;
  email: string;
  token: string;
  roles?: string[];
  invitationId?: string | null;
}): Promise<SendEmailResult> {
  const contentArgs: { email: string; token: string; roles?: string[] } = {
    email: input.email,
    token: input.token
  };
  if (input.roles) contentArgs.roles = input.roles;
  const content = invitationEmailContent(contentArgs);
  return sendWorkflowEmail({
    organizationId: input.organizationId,
    templateKey: "user_invitation",
    idempotencyKey: `${input.organizationId}:user_invitation:${input.invitationId ?? input.token}:${input.email.toLowerCase()}`,
    to: { email: input.email },
    subject: content.subject,
    body: `You have been invited to join an organization on My Property Assistant${
      input.roles?.length ? ` as ${input.roles.join(", ")}` : ""
    }. Use the link in this email to accept.`,
    href: `/accept-invitation/${input.token}`,
    correlation: {
      sourceEntityType: "organization_invitation",
      sourceEntityId: input.invitationId ?? input.token
    }
  });
}

export function templateKeyForNotify(input: {
  category: string;
  eventKey: string;
  sourceEntityType?: string | null;
}): EmailTemplateKey {
  if (input.eventKey.includes("welcome") || input.eventKey.startsWith("resident.welcome")) {
    return "welcome_email";
  }
  if (input.sourceEntityType === "announcement" || input.category === "announcements") {
    return "announcement_email";
  }
  if (input.category === "maintenance") return "maintenance_notification";
  if (input.sourceEntityType === "owner_statement" || input.eventKey.includes("statement")) {
    return "owner_statement";
  }
  if (input.category === "financial") return "financial_report";
  return "general_notification";
}
