import type { EmailTemplateKey } from "./contracts";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appBaseUrl(): string {
  return (
    process.env["NEXT_PUBLIC_APP_URL"]?.trim() ||
    process.env["NEXT_PUBLIC_SITE_URL"]?.trim() ||
    "https://www.my-property-assistant.com"
  ).replace(/\/$/, "");
}

/** Thin HTML/text wrapper — no new marketing templates (INT-303). */
export function renderTransactionalEmail(input: {
  templateKey: EmailTemplateKey;
  subject: string;
  body: string;
  href?: string | null;
  recipientName?: string | null;
}): { subject: string; html: string; text: string } {
  const subject = input.subject.trim();
  const body = input.body.trim();
  const greeting = input.recipientName?.trim() ? `Hello ${input.recipientName.trim()},` : "Hello,";
  const link = input.href?.startsWith("http")
    ? input.href
    : input.href
      ? `${appBaseUrl()}${input.href.startsWith("/") ? "" : "/"}${input.href}`
      : null;

  const textParts = [greeting, "", body];
  if (link) textParts.push("", `Open in M.P.A.: ${link}`);
  textParts.push("", "— My Property Assistant");

  const html = `<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;line-height:1.5;color:#1c1917;background:#fafaf9;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:28px 24px;border:1px solid #e7e5e4;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#78716c;">My Property Assistant</p>
    <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(body)}</p>
    ${
      link
        ? `<p style="margin:24px 0;"><a href="${escapeHtml(link)}" style="display:inline-block;background:#292524;color:#fafaf9;text-decoration:none;padding:10px 16px;">Open in M.P.A.</a></p>`
        : ""
    }
    <p style="margin:24px 0 0;font-size:12px;color:#78716c;">This message was sent by M.P.A. (${escapeHtml(input.templateKey)}).</p>
  </div>
</body></html>`;

  return { subject, html, text: textParts.join("\n") };
}

export function invitationEmailContent(input: {
  email: string;
  token: string;
  roles?: string[];
}): { subject: string; html: string; text: string } {
  const acceptPath = `/accept-invitation/${input.token}`;
  const roleLabel = input.roles?.length ? input.roles.join(", ") : "member";
  return renderTransactionalEmail({
    templateKey: "user_invitation",
    subject: "You're invited to My Property Assistant",
    body: `You have been invited to join an organization on My Property Assistant as ${roleLabel}. Use the link below to accept your invitation.`,
    href: acceptPath,
    recipientName: null
  });
}
