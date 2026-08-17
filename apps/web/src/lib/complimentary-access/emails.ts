import { escapeHtml, renderFoundationEmail, sendResendHttpEmail } from "@mpa/email";
import {
  complimentaryExpiryCopy,
  complimentaryWelcomeCopy,
  resolveResendSender,
  TESTER_FEEDBACK_REPLY_TO,
  type ComplimentaryGrant
} from "@mpa/shared";
import { logEmailAttempt } from "../communications/email-log";
import { serverEnv } from "../env/server-env";

function allowDevEmailStub(): boolean {
  if (process.env["VERCEL_ENV"] === "production" || process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env["VITEST"] === "true" || process.env["MPA_ALLOW_EMAIL_STUB"] === "true";
}

function claimUrl(token: string): string {
  const base = serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}/complimentary/claim?token=${encodeURIComponent(token)}`;
}

function convertUrl(): string {
  const base = serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}/pricing?from=complimentary`;
}

async function sendHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  kind: "welcome" | "expiry";
  replyTo?: string;
}): Promise<{ ok: true; providerId: string; stubbed?: boolean } | { ok: false; error: string }> {
  const sender = resolveResendSender();
  if (!sender.ok) {
    if (allowDevEmailStub()) {
      return { ok: true, providerId: `stub_${Date.now()}`, stubbed: true };
    }
    logEmailAttempt({
      template: `complimentary.${input.kind}`,
      to: input.to,
      status: "skipped",
      error: sender.error,
      fromSource: "none"
    });
    return {
      ok: false,
      error: "email_not_configured: RESEND_API_KEY and RESEND_FROM_EMAIL are required"
    };
  }
  const result = await sendResendHttpEmail({
    apiKey: sender.apiKey,
    from: sender.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    tags: [
      { name: "journey", value: "complimentary-access" },
      { name: "template", value: input.kind }
    ]
  });
  logEmailAttempt({
    template: `complimentary.${input.kind}`,
    to: input.to,
    status: result.ok ? "provider_accepted" : "failed",
    fromSource: sender.fromSource,
    ...(result.ok ? { providerId: result.providerId } : { error: result.error })
  });
  return result;
}

export function renderComplimentaryWelcomeEmail(input: {
  grant: Pick<ComplimentaryGrant, "grantType" | "productSku" | "expiresAt" | "recipientEmail">;
  claimToken: string;
}): { subject: string; html: string; text: string; replyTo: string } {
  const copy = complimentaryWelcomeCopy(input.grant);
  const url = claimUrl(input.claimToken);
  const feedback = copy.testerFeedback
    ? `<p style="margin:0 0 16px 0;">${escapeHtml(copy.testerFeedback)}</p>`
    : "";
  const body = [
    `<p style="margin:0 0 16px 0;">You have complimentary access to <strong>${escapeHtml(copy.productLabel)}</strong>.</p>`,
    `<p style="margin:0 0 16px 0;"><strong>${escapeHtml(copy.expirationLine)}</strong></p>`,
    `<p style="margin:0 0 16px 0;">${escapeHtml(copy.paymentLine)}</p>`,
    feedback
  ].join("");
  const html = renderFoundationEmail({
    title: copy.headline,
    previewText: copy.preview,
    body,
    ctaUrl: url,
    ctaLabel: copy.ctaLabel
  });
  const text = [
    copy.headline,
    "",
    `You have complimentary access to ${copy.productLabel}.`,
    copy.expirationLine,
    copy.paymentLine,
    copy.testerFeedback ?? "",
    "",
    `${copy.ctaLabel}: ${url}`,
    "",
    "If the button does not work, copy this link:",
    url
  ]
    .filter((line) => line !== "")
    .join("\n");
  return { subject: copy.subject, html, text, replyTo: TESTER_FEEDBACK_REPLY_TO };
}

export function renderComplimentaryExpiryEmail(input: {
  grant: Pick<ComplimentaryGrant, "productSku" | "expiresAt">;
}): { subject: string; html: string; text: string } {
  if (!input.grant.expiresAt) {
    throw new Error("expiry_email_requires_expiration");
  }
  const copy = complimentaryExpiryCopy({
    productSku: input.grant.productSku,
    expiresAt: input.grant.expiresAt
  });
  const url = convertUrl();
  const html = renderFoundationEmail({
    title: copy.subject,
    previewText: copy.preview,
    body: `<p>${escapeHtml(copy.preview)}</p><p>${escapeHtml(copy.chargeLine)}</p>`,
    ctaUrl: url,
    ctaLabel: copy.ctaLabel
  });
  const text = `${copy.subject}\n\n${copy.preview}\n${copy.chargeLine}\n\n${copy.ctaLabel}: ${url}`;
  return { subject: copy.subject, html, text };
}

export async function sendComplimentaryWelcomeEmail(input: {
  grant: Pick<ComplimentaryGrant, "grantType" | "productSku" | "expiresAt" | "recipientEmail">;
  claimToken: string;
}): Promise<{ ok: boolean; stubbed?: boolean; error?: string }> {
  const rendered = renderComplimentaryWelcomeEmail(input);
  const result = await sendHtmlEmail({
    to: input.grant.recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    kind: "welcome",
    replyTo: rendered.replyTo
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, ...(result.stubbed ? { stubbed: true } : {}) };
}

export async function sendComplimentaryExpiryEmail(input: {
  grant: Pick<ComplimentaryGrant, "productSku" | "expiresAt" | "recipientEmail">;
}): Promise<{ ok: boolean; stubbed?: boolean; error?: string }> {
  const rendered = renderComplimentaryExpiryEmail(input);
  const result = await sendHtmlEmail({
    to: input.grant.recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    kind: "expiry"
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, ...(result.stubbed ? { stubbed: true } : {}) };
}
