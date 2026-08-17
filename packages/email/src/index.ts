export type FoundationEmailTemplateProps = {
  title: string;
  previewText?: string;
  body: string;
};

/**
 * Foundation email renderer placeholder for generic HTML bodies.
 */
export function renderFoundationEmail(props: FoundationEmailTemplateProps): string {
  const preview = props.previewText ? `<p>${props.previewText}</p>` : "";
  return `<html><body><h1>${props.title}</h1>${preview}<div>${props.body}</div></body></html>`;
}

export type InvitationEmailProps = {
  organizationName: string;
  roleLabel: string;
  acceptUrl: string;
  inviterLabel?: string | undefined;
};

export function renderInvitationEmail(props: InvitationEmailProps): { subject: string; html: string; text: string } {
  const subject = `You're invited to ${props.organizationName} on M.P.A.`;
  const who = props.inviterLabel ? `${props.inviterLabel} invited you` : "You've been invited";
  const text = [
    subject,
    "",
    `${who} to join ${props.organizationName} as ${props.roleLabel}.`,
    "",
    `Accept your invitation: ${props.acceptUrl}`,
    "",
    "This link expires in 7 days."
  ].join("\n");

  const html = renderFoundationEmail({
    title: subject,
    previewText: `${who} as ${props.roleLabel}.`,
    body: `
      <p>${who} to join <strong>${escapeHtml(props.organizationName)}</strong> as <strong>${escapeHtml(props.roleLabel)}</strong>.</p>
      <p><a href="${escapeHtml(props.acceptUrl)}">Accept invitation</a></p>
      <p>Or copy this link:<br/><code>${escapeHtml(props.acceptUrl)}</code></p>
      <p>This link expires in 7 days.</p>
    `
  });

  return { subject, html, text };
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
