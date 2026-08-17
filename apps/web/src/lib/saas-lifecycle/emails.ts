import { escapeHtml, renderFoundationEmail, sendResendHttpEmail } from "@mpa/email";
import { resolveResendSender } from "@mpa/shared";
import { logEmailAttempt } from "../communications/email-log";

export type LifecycleEmailKind =
  | "renewal_success"
  | "payment_failed"
  | "card_expiring"
  | "grace_warning"
  | "subscription_canceled"
  | "subscription_restored";

function allowDevEmailStub(): boolean {
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
  kind: LifecycleEmailKind;
}): Promise<{ ok: true; providerId: string; stubbed?: boolean } | { ok: false; error: string }> {
  const sender = resolveResendSender();
  if (!sender.ok) {
    if (allowDevEmailStub()) {
      return { ok: true, providerId: `stub_${Date.now()}`, stubbed: true };
    }
    logEmailAttempt({
      template: `saas-lifecycle.${input.kind}`,
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
      { name: "journey", value: "saas-lifecycle" },
      { name: "template", value: input.kind }
    ]
  });
  logEmailAttempt({
    template: `saas-lifecycle.${input.kind}`,
    to: input.to,
    status: result.ok ? "provider_accepted" : "failed",
    fromSource: sender.fromSource,
    ...(result.ok ? { providerId: result.providerId } : { error: result.error })
  });
  return result;
}

export async function sendLifecycleEmail(input: {
  kind: LifecycleEmailKind;
  to: string;
  billingUrl: string;
  planLabel?: string;
}): Promise<{ ok: boolean; stubbed?: boolean; error?: string }> {
  const plan = input.planLabel ?? "your Property Manager plan";
  const copy: Record<
    LifecycleEmailKind,
    { subject: string; body: string; ctaLabel: string; preview: string }
  > = {
    renewal_success: {
      subject: "Your M.P.A. subscription renewed",
      preview: "Payment succeeded. Your workspace remains active.",
      body: `<p>Payment for <strong>${escapeHtml(plan)}</strong> succeeded. Your workspace remains active.</p><p>You are receiving this as a billing confirmation for your M.P.A. subscription.</p>`,
      ctaLabel: "View billing"
    },
    payment_failed: {
      subject: "Action needed: we could not renew your M.P.A. subscription",
      preview: "Update your payment method to keep your workspace.",
      body: `<p>We could not collect payment for <strong>${escapeHtml(plan)}</strong>.</p><p>Your workspace stays available during a short grace period. Update your payment method to avoid interruption.</p>`,
      ctaLabel: "Update payment method"
    },
    card_expiring: {
      subject: "Your payment card is expiring soon",
      preview: "Update your card so renewals continue without interruption.",
      body: `<p>Update your card so renewals for <strong>${escapeHtml(plan)}</strong> continue without interruption.</p>`,
      ctaLabel: "Update billing"
    },
    grace_warning: {
      subject: "Reminder: update payment to keep your M.P.A. workspace",
      preview: "Payment is still outstanding. Update billing before grace ends.",
      body: `<p>Payment for <strong>${escapeHtml(plan)}</strong> is still outstanding.</p><p>Please update billing before the grace period ends so your workspace stays available.</p>`,
      ctaLabel: "Fix payment"
    },
    subscription_canceled: {
      subject: "Your M.P.A. subscription was canceled",
      preview: "Access continues through the paid period when one applies.",
      body: `<p><strong>${escapeHtml(plan)}</strong> is canceled.</p><p>Access continues through the paid period when one applies; renewal will not continue after that. Reactivate from Billing while access remains, or after access ends to restore your workspace. Your data is retained.</p>`,
      ctaLabel: "Manage subscription"
    },
    subscription_restored: {
      subject: "Your M.P.A. subscription is restored",
      preview: "Welcome back. Mission Control is available again.",
      body: `<p>Welcome back — <strong>${escapeHtml(plan)}</strong> is active again and Mission Control is available.</p>`,
      ctaLabel: "View billing"
    }
  };
  const selected = copy[input.kind];
  const html = renderFoundationEmail({
    title: selected.subject,
    previewText: selected.preview,
    body: selected.body,
    ctaUrl: input.billingUrl,
    ctaLabel: selected.ctaLabel
  });
  const result = await sendHtmlEmail({
    to: input.to,
    subject: selected.subject,
    html,
    text: `${selected.subject}\n\n${selected.ctaLabel}: ${input.billingUrl}`,
    kind: input.kind
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, ...(result.stubbed ? { stubbed: true } : {}) };
}
