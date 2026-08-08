import { renderFoundationEmail } from "@mpa/email";
import { serverEnv } from "../env/server-env";

export type LifecycleEmailKind =
  | "renewal_success"
  | "payment_failed"
  | "card_expiring"
  | "grace_warning"
  | "subscription_canceled"
  | "subscription_restored";

async function sendHtmlEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: true; providerId: string; stubbed?: boolean } | { ok: false; error: string }> {
  if (!serverEnv.RESEND_API_KEY || !serverEnv.RESEND_FROM_EMAIL) {
    return { ok: true, providerId: `stub_${Date.now()}`, stubbed: true };
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
      body: `<p><strong>${plan}</strong> is canceled. Your data is retained. Reactivate anytime from Billing.</p><p><a href="${input.billingUrl}">Manage subscription</a></p>`
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
