import { renderFoundationEmail } from "@mpa/email";
import { serverEnv } from "../env/server-env";

export type SendOperationalNoticeResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string };

export async function sendOperationalNoticeEmail(input: {
  to: string;
  subject: string;
  body: string;
  audienceLabel?: string;
}): Promise<SendOperationalNoticeResult> {
  if (!serverEnv.RESEND_API_KEY || !serverEnv.RESEND_FROM_EMAIL) {
    return { ok: false, error: "Email provider is not configured" };
  }

  const html = renderFoundationEmail({
    title: input.subject,
    previewText: input.audienceLabel
      ? `Message for ${input.audienceLabel}`
      : "Message from your property manager",
    body: `<p>${escapeHtml(input.body).replaceAll("\n", "<br/>")}</p>`
  });
  const text = `${input.subject}\n\n${input.body}`;

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
        html,
        text,
        tags: [
          { name: "journey", value: "promise-remediation" },
          { name: "template", value: "operational-notice" }
        ]
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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
