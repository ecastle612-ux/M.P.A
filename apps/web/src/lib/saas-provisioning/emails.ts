import { escapeHtml, renderFoundationEmail, sendResendHttpEmail } from "@mpa/email";
import { resolveResendSender } from "@mpa/shared";
import { logEmailAttempt } from "../communications/email-log";

export type ProvisionEmailKind =
  | "verification"
  | "welcome"
  | "progress"
  | "failure_recovery"
  | "continue_setup";

function allowDevEmailStub(): boolean {
  // Production never stubs. Vitest / explicit local override may stub for offline runs.
  if (process.env["VERCEL_ENV"] === "production" || process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env["VITEST"] === "true" || process.env["MPA_ALLOW_EMAIL_STUB"] === "true";
}

async function sendHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  kind: ProvisionEmailKind;
}): Promise<{ ok: true; providerId: string; stubbed?: boolean } | { ok: false; error: string }> {
  const sender = resolveResendSender();
  if (!sender.ok) {
    if (allowDevEmailStub()) {
      return { ok: true, providerId: `stub_${Date.now()}`, stubbed: true };
    }
    logEmailAttempt({
      template: `provisioning.${input.kind}`,
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
    tags: [
      { name: "journey", value: "saas-provisioning" },
      { name: "template", value: input.kind }
    ]
  });
  logEmailAttempt({
    template: `provisioning.${input.kind}`,
    to: input.to,
    status: result.ok ? "provider_accepted" : "failed",
    fromSource: sender.fromSource,
    ...(result.ok ? { providerId: result.providerId } : { error: result.error })
  });
  return result;
}

export async function sendProvisioningEmail(input: {
  kind: ProvisionEmailKind;
  to: string;
  continueUrl: string;
  organizationName?: string | null;
  checkpoint?: string;
}): Promise<{ ok: boolean; stubbed?: boolean; error?: string }> {
  const org = input.organizationName ?? "your M.P.A. workspace";
  const copy: Record<
    ProvisionEmailKind,
    { subject: string; body: string; ctaLabel: string; preview: string }
  > = {
    verification: {
      subject: "Verify your email to claim your M.P.A. workspace",
      preview: "Your payment succeeded. Continue setup to claim your workspace.",
      body: `<p>Your payment was successful. Verify this email, then create your password to claim <strong>${escapeHtml(org)}</strong>.</p><p>You are receiving this because you purchased My Property Assistant.</p>`,
      ctaLabel: "Continue setup"
    },
    welcome: {
      subject: "Welcome to My Property Assistant",
      preview: "Your workspace is ready. Continue Guided Setup.",
      body: `<p>Your workspace <strong>${escapeHtml(org)}</strong> is ready.</p><p>Continue Guided Setup, then open Mission Control to start daily operations.</p>`,
      ctaLabel: "Continue"
    },
    progress: {
      subject: "We're preparing your M.P.A. workspace",
      preview: "Provisioning is in progress. No action needed unless we email you again.",
      body: `<p>Provisioning is in progress${input.checkpoint ? ` (${escapeHtml(input.checkpoint)})` : ""}. This is automatic — no action is needed unless we email you to claim your account.</p>`,
      ctaLabel: "View progress"
    },
    failure_recovery: {
      subject: "Action needed to finish your M.P.A. setup",
      preview: "Your payment is safe. Continue to resume setup.",
      body: `<p>We hit a recoverable issue while preparing your workspace. Your payment is safe.</p><p>Continue to resume setup from where you left off.</p>`,
      ctaLabel: "Resume setup"
    },
    continue_setup: {
      subject: "Continue your M.P.A. Guided Setup",
      preview: "Your organization is ready. Finish Guided Setup.",
      body: `<p>Your organization is ready. Finish Guided Setup to enter Mission Control.</p>`,
      ctaLabel: "Open Guided Setup"
    }
  };
  const selected = copy[input.kind];
  const html = renderFoundationEmail({
    title: selected.subject,
    previewText: selected.preview,
    body: selected.body,
    ctaUrl: input.continueUrl,
    ctaLabel: selected.ctaLabel
  });
  const result = await sendHtmlEmail({
    to: input.to,
    subject: selected.subject,
    html,
    text: `${selected.subject}\n\n${selected.ctaLabel}: ${input.continueUrl}`,
    kind: input.kind
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, ...(result.stubbed ? { stubbed: true } : {}) };
}
