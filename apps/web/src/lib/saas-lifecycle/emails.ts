import { renderFoundationEmail } from "@mpa/email";
import { serverEnv } from "../env/server-env";

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
}): Promise<{ ok: true; providerId: string; stubbed?: boolean } | { ok: false; error: string }> {
  if (!serverEnv.RESEND_API_KEY || !serverEnv.RESEND_FROM_EMAIL) {
    // Never report success when mail cannot be delivered (PRA-001).
    if (allowDevEmailStub()) {
      return { ok: true, providerId: `stub_${Date.now()}`, stubbed: true };
    }
    return {
      ok: false,
      error: "email_not_configured: RESEND_API_KEY and RESEND_FROM_EMAIL are required"
    };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: serverEnv.RESEND_FROM_EMAIL,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text
      })
    });
    if (!response.ok) {
      return { ok: false, error: await response.text() };
    }
    const data = (await response.json()) as { id?: string };
    return { ok: true, providerId: data.id ?? "resend" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "email_failed" };
  }
}

export async function sendLifecycleEmail(input: {
  kind: LifecycleEmailKind;
  to: string;
  billingUrl: string;
  planLabel?: string;
}): Promise<{ ok: boolean; stubbed?: boolean; error?: string }> {
  const plan = input.planLabel ?? "your Property Manager plan";
  const copy: Record<LifecycleEmailKind, { subject: string; body: string }> = {
    renewal_success: {
      subject: "Your M.P.A. subscription renewed",
      body: `<p>Payment for <strong>${plan}</strong> succeeded. Your workspace remains active.</p><p><a href="${input.billingUrl}">View billing</a></p>`
    },
    payment_failed: {
      subject: "Action needed: we could not renew your M.P.A. subscription",
      body: `<p>We could not collect payment for <strong>${plan}</strong>. Your workspace stays available during a short grace period.</p><p><a href="${input.billingUrl}">Update payment method</a></p>`
    },
    card_expiring: {
      subject: "Your payment card is expiring soon",
      body: `<p>Update your card so renewals for <strong>${plan}</strong> continue without interruption.</p><p><a href="${input.billingUrl}">Update billing</a></p>`
    },
    grace_warning: {
      subject: "Reminder: update payment to keep your M.P.A. workspace",
      body: `<p>Payment for <strong>${plan}</strong> is still outstanding. Please update billing before the grace period ends.</p><p><a href="${input.billingUrl}">Fix payment</a></p>`
    },
    subscription_canceled: {
      subject: "Your M.P.A. subscription was canceled",
      body: `<p><strong>${plan}</strong> is canceled. Access continues through the paid period when one applies; renewal will not continue after that. Reactivate from Billing while access remains, or after access ends to restore your workspace. Your data is retained.</p><p><a href="${input.billingUrl}">Manage subscription</a></p>`
    },
    subscription_restored: {
      subject: "Your M.P.A. subscription is restored",
      body: `<p>Welcome back — <strong>${plan}</strong> is active again and Mission Control is available.</p><p><a href="${input.billingUrl}">View billing</a></p>`
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
    text: `${selected.subject}\n\n${input.billingUrl}`
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, ...(result.stubbed ? { stubbed: true } : {}) };
}
