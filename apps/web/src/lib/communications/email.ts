import { renderFoundationEmail, sendResendHttpEmail } from "@mpa/email";
import { resolveResendSender } from "@mpa/shared";
import { logEmailAttempt } from "./email-log";

export type SendOperationalNoticeResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string };

export async function sendOperationalNoticeEmail(input: {
  to: string;
  subject: string;
  body: string;
  audienceLabel?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  idempotencyKey?: string;
}): Promise<SendOperationalNoticeResult> {
  const sender = resolveResendSender();
  if (!sender.ok) {
    logEmailAttempt({
      template: "operational-notice",
      to: input.to,
      status: "skipped",
      error: sender.error,
      fromSource: "none"
    });
    return { ok: false, error: "Email provider is not configured" };
  }

  const html = renderFoundationEmail({
    title: input.subject,
    previewText: input.audienceLabel
      ? `Message for ${input.audienceLabel}`
      : "Message from your property team",
    body: `<p>${escapeHtml(input.body).replaceAll("\n", "<br/>")}</p>`,
    ...(input.ctaUrl
      ? {
          ctaUrl: input.ctaUrl,
          ctaLabel: input.ctaLabel ?? "Open in M.P.A."
        }
      : {})
  });
  const text = input.ctaUrl
    ? `${input.subject}\n\n${input.body}\n\n${input.ctaLabel ?? "Open in M.P.A."}: ${input.ctaUrl}`
    : `${input.subject}\n\n${input.body}`;

  const result = await sendResendHttpEmail({
    apiKey: sender.apiKey,
    from: sender.from,
    to: input.to,
    subject: input.subject,
    html,
    text,
    tags: [
      { name: "journey", value: "promise-remediation" },
      { name: "template", value: "operational-notice" }
    ],
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {})
  });

  if (result.ok) {
    logEmailAttempt({
      template: "operational-notice",
      to: input.to,
      status: "provider_accepted",
      providerId: result.providerId,
      fromSource: sender.fromSource
    });
    return result;
  }

  logEmailAttempt({
    template: "operational-notice",
    to: input.to,
    status: "failed",
    error: result.error,
    fromSource: sender.fromSource
  });
  return result;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
