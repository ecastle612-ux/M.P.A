import { invitationEmailCopy as invitationCopy } from "./copy";
import { paragraphsToHtml, renderBrandedEmail } from "./shell";

export {
  escapeHtml,
  MPA_EMAIL_BRAND_NAME,
  MPA_EMAIL_BRAND_TAGLINE,
  MPA_EMAIL_LOGO_PATH,
  MPA_EMAIL_PRODUCTION_ORIGIN,
  paragraphsToHtml,
  renderBrandedEmail,
  resolveEmailLogoUrl,
  resolvePublicBrandOrigin
} from "./shell";
export {
  invitationAudienceFromRoleLabel,
  invitationEmailCopy,
  lifecycleEmailPresentation
} from "./copy";

export type FoundationEmailTemplateProps = {
  title: string;
  previewText?: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
};

/**
 * Branded HTML email used by all Resend customer templates.
 * `body` may contain simple HTML such as <p> and <strong>.
 */
export function renderFoundationEmail(props: FoundationEmailTemplateProps): string {
  return renderBrandedEmail({
    title: props.title,
    bodyHtml: props.body,
    ...(props.previewText ? { previewText: props.previewText } : {}),
    ...(props.ctaUrl ? { ctaUrl: props.ctaUrl } : {}),
    ...(props.ctaLabel ? { ctaLabel: props.ctaLabel } : {})
  });
}

export type InvitationEmailProps = {
  organizationName: string;
  roleLabel: string;
  acceptUrl: string;
  inviterLabel?: string | undefined;
};

export function renderInvitationEmail(props: InvitationEmailProps): { subject: string; html: string; text: string } {
  const copy = invitationCopy({
    organizationName: props.organizationName,
    roleLabel: props.roleLabel,
    ...(props.inviterLabel ? { inviterLabel: props.inviterLabel } : {})
  });
  const text = [copy.headline, "", ...copy.paragraphs, "", `${copy.ctaLabel}: ${props.acceptUrl}`].join("\n");
  const html = renderBrandedEmail({
    title: copy.headline,
    previewText: copy.previewText,
    bodyHtml: paragraphsToHtml(copy.paragraphs.join("\n\n")),
    ctaUrl: props.acceptUrl,
    ctaLabel: copy.ctaLabel
  });

  return { subject: copy.subject, html, text };
}

export type SendInvitationEmailInput = {
  apiKey: string;
  from: string;
  to: string;
  organizationName: string;
  roleLabel: string;
  acceptUrl: string;
  inviterLabel?: string | undefined;
};

export type SendInvitationEmailResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string };

export type SendResendHttpEmailInput = {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: Array<{ name: string; value: string }>;
  idempotencyKey?: string;
};

/** Sends via Resend HTTP API (no SDK dependency). Does not claim inbox delivery. */
export async function sendResendHttpEmail(
  input: SendResendHttpEmailInput
): Promise<SendInvitationEmailResult> {
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json"
    };
    if (input.idempotencyKey) {
      headers["Idempotency-Key"] = input.idempotencyKey.slice(0, 256);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.tags && input.tags.length > 0 ? { tags: input.tags } : {})
      })
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        error: payload.message ?? payload.name ?? `Resend error ${response.status}`
      };
    }

    return { ok: true, providerId: payload.id ?? "unknown" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email"
    };
  }
}

/** Sends via Resend HTTP API (no SDK dependency). */
export async function sendInvitationEmail(
  input: SendInvitationEmailInput & { idempotencyKey?: string }
): Promise<SendInvitationEmailResult> {
  const content = renderInvitationEmail({
    organizationName: input.organizationName,
    roleLabel: input.roleLabel,
    acceptUrl: input.acceptUrl,
    ...(input.inviterLabel ? { inviterLabel: input.inviterLabel } : {})
  });

  return sendResendHttpEmail({
    apiKey: input.apiKey,
    from: input.from,
    to: input.to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags: [
      { name: "journey", value: "launch-001-j2" },
      { name: "template", value: "team-invitation" }
    ],
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {})
  });
}
