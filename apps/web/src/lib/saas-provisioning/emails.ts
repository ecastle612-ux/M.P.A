import { renderFoundationEmail, sendResendHttpEmail } from "@mpa/email";
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
  const copy: Record<ProvisionEmailKind, { subject: string; body: string }> = {
    verification: {
      subject: "Verify your email to claim your M.P.A. workspace",
      body: `<p>Your payment was successful. Verify ownership of this email, then create your password to claim <strong>${org}</strong>.</p><p><a href="${input.continueUrl}">Continue setup</a></p>`
    },
    welcome: {
      subject: "Welcome to My Property Assistant",
      body: `<p>Your workspace <strong>${org}</strong> is ready. Continue Guided Setup, then open Mission Control.</p><p><a href="${input.continueUrl}">Continue</a></p>`
    },
    progress: {
      subject: "We’re preparing your M.P.A. workspace",
      body: `<p>Provisioning is in progress${input.checkpoint ? ` (${input.checkpoint})` : ""}. This is automatic — no action needed unless we email you to claim your account.</p><p><a href="${input.continueUrl}">View progress</a></p>`
    },
    failure_recovery: {
      subject: "Action needed to finish your M.P.A. setup",
      body: `<p>We hit a recoverable issue while preparing your workspace. Your payment is safe. Continue to resume.</p><p><a href="${input.continueUrl}">Resume setup</a></p>`
    },
    continue_setup: {
      subject: "Continue your M.P.A. Guided Setup",
      body: `<p>Your organization is ready. Finish Guided Setup to enter Mission Control.</p><p><a href="${input.continueUrl}">Open Guided Setup</a></p>`
    }
  };
  const selected = copy[input.kind];
  const html = renderFoundationEmail({
    title: selected.subject,
    previewText: "My Property Assistant",
    body: selected.body
  });
  const result = await sendHtmlEmail({
    to: input.to,
    subject: selected.subject,
    html,
    text: `${selected.subject}\n\n${input.continueUrl}`,
    kind: input.kind
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, ...(result.stubbed ? { stubbed: true } : {}) };
}
