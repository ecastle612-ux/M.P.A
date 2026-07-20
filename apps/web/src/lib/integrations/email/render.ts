import type { EmailTemplateKey } from "./contracts";
import { MPA_LOGO_ASPECT_RATIO, MPA_LOGO_WIDTH, logoPathForTone } from "../../branding";
import {
  EMAIL_BRAND_NAME,
  EMAIL_BRAND_TAGLINE,
  EMAIL_SUPPORT_ADDRESS,
  EMAIL_TOKENS as T
} from "./email-tokens";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function appBaseUrl(): string {
  return (
    process.env["NEXT_PUBLIC_APP_URL"]?.trim() ||
    process.env["NEXT_PUBLIC_SITE_URL"]?.trim() ||
    "https://www.my-property-assistant.com"
  ).replace(/\/$/, "");
}

function absoluteUrl(href: string | null | undefined): string | null {
  if (!href?.trim()) return null;
  const value = href.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${appBaseUrl()}${value.startsWith("/") ? "" : "/"}${value}`;
}

const TEMPLATE_DEFAULTS: Record<
  EmailTemplateKey,
  { eyebrow: string; title: string; ctaLabel: string; preview: string }
> = {
  user_invitation: {
    eyebrow: "Invitation",
    title: "You're invited to M.P.A.",
    ctaLabel: "Accept invitation",
    preview: "Accept your invitation to join your organization on M.P.A."
  },
  welcome_email: {
    eyebrow: "Welcome",
    title: "Welcome to My Property Assistant",
    ctaLabel: "Open your portal",
    preview: "Your M.P.A. account is ready."
  },
  announcement_email: {
    eyebrow: "Announcement",
    title: "New announcement",
    ctaLabel: "View announcement",
    preview: "You have a new property announcement."
  },
  maintenance_notification: {
    eyebrow: "Maintenance",
    title: "Maintenance update",
    ctaLabel: "View work order",
    preview: "There is a maintenance update for your property."
  },
  owner_statement: {
    eyebrow: "Owner statement",
    title: "Your statement is ready",
    ctaLabel: "View statement",
    preview: "Your owner statement is ready to review."
  },
  financial_report: {
    eyebrow: "Financial",
    title: "Financial update",
    ctaLabel: "Open financials",
    preview: "A financial update is available in M.P.A."
  },
  general_notification: {
    eyebrow: "Notification",
    title: "Update from M.P.A.",
    ctaLabel: "Open in M.P.A.",
    preview: "You have a new update in M.P.A."
  },
  password_reset: {
    eyebrow: "Security",
    title: "Reset your password",
    ctaLabel: "Reset password",
    preview: "Reset your My Property Assistant password."
  }
};

function bodyParagraphsHtml(body: string): string {
  const blocks = body
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (blocks.length === 0) return "";
  return blocks
    .map((block) => {
      const withBreaks = escapeHtml(block).replace(/\n/g, "<br />");
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${T.inkPrimary};">${withBreaks}</p>`;
    })
    .join("");
}

export type RenderMpaEmailInput = {
  templateKey: EmailTemplateKey;
  subject: string;
  body: string;
  href?: string | null;
  recipientName?: string | null;
  title?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
  previewText?: string | null;
  secondaryNote?: string | null;
  /** When set, used as CTA href without resolving against app base (Auth templates). */
  rawHref?: string | null;
};

/**
 * EML-001 — Canopy-aligned transactional email HTML + plain text.
 * Presentation only; callers supply subject/body/href from existing workflows.
 */
export function renderMpaEmail(input: RenderMpaEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const defaults = TEMPLATE_DEFAULTS[input.templateKey];
  const subject = input.subject.trim() || defaults.title;
  const body = input.body.trim();
  const title = (input.title?.trim() || subject || defaults.title).trim();
  const eyebrow = (input.eyebrow?.trim() || defaults.eyebrow).trim();
  const ctaLabel = (input.ctaLabel?.trim() || defaults.ctaLabel).trim();
  const previewSource = input.previewText?.trim() || body || defaults.preview;
  const previewText = previewSource.replace(/\s+/g, " ").slice(0, 110);
  const greeting = input.recipientName?.trim()
    ? `Hello ${input.recipientName.trim()},`
    : "Hello,";
  const link = input.rawHref?.trim() || absoluteUrl(input.href);
  const logoPath = logoPathForTone("dark-surface");
  const logoUrl = absoluteUrl(logoPath) ?? `${appBaseUrl()}${logoPath}`;
  const logoWidth = MPA_LOGO_WIDTH.email;
  const logoHeight = Math.round(logoWidth * MPA_LOGO_ASPECT_RATIO);
  const year = new Date().getFullYear();
  const secondaryNote =
    input.secondaryNote?.trim() ||
    "If you did not expect this message, you can ignore it or contact support.";

  const ctaBlock = link
    ? `
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
                    <tr>
                      <td align="left" bgcolor="${T.brandPrimary}" style="border-radius:6px;background-color:${T.brandPrimary};">
                        <a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 20px;font-family:${T.fontStack};font-size:15px;font-weight:600;line-height:1;color:${T.inkInverse};text-decoration:none;border-radius:6px;">
                          ${escapeHtml(ctaLabel)}
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 20px;font-size:13px;line-height:1.5;color:${T.inkSecondary};">
                    Or paste this link into your browser:<br />
                    <a href="${escapeHtml(link)}" style="color:${T.brandPrimary};word-break:break-all;">${escapeHtml(link)}</a>
                  </p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    @media (prefers-color-scheme: dark) {
      .mpa-email-page { background-color: #0f1419 !important; }
      .mpa-email-card { background-color: #1a2420 !important; border-color: #2a3530 !important; }
      .mpa-email-title, .mpa-email-body, .mpa-email-greeting { color: #f4f7f6 !important; }
      .mpa-email-meta, .mpa-email-footer { color: #a8b5b0 !important; }
    }
  </style>
</head>
<body class="mpa-email-page" style="margin:0;padding:0;background-color:${T.surfacePage};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(previewText)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="mpa-email-page" style="background-color:${T.surfacePage};margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;border-collapse:separate;">
          <tr>
            <td class="mpa-email-card" style="background-color:${T.surfaceCard};border:1px solid ${T.borderSubtle};border-radius:12px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" style="background-color:${T.headerTop};background-image:linear-gradient(165deg, ${T.headerTop} 0%, ${T.headerBottom} 100%);padding:22px 28px;border-bottom:3px solid ${T.brandPrimary};">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:14px;">
                          <img src="${escapeHtml(logoUrl)}" width="${logoWidth}" height="${logoHeight}" alt="${escapeHtml(`${EMAIL_BRAND_NAME} ${EMAIL_BRAND_TAGLINE}`)}" style="display:block;width:${logoWidth}px;height:${logoHeight}px;max-width:${logoWidth}px;border:0;outline:none;" />
                        </td>
                        <td style="vertical-align:middle;">
                          <div style="font-family:${T.fontStack};font-size:18px;font-weight:700;line-height:1.2;color:${T.inkInverse};letter-spacing:0.02em;">${escapeHtml(EMAIL_BRAND_NAME)}</div>
                          <div style="font-family:${T.fontStack};font-size:12px;line-height:1.3;color:rgba(255,255,255,0.72);margin-top:2px;">${escapeHtml(EMAIL_BRAND_TAGLINE)}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 28px 8px;font-family:${T.fontStack};">
                    <p class="mpa-email-meta" style="margin:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${T.inkSecondary};">${escapeHtml(eyebrow)}</p>
                    <h1 class="mpa-email-title" style="margin:0 0 18px;font-size:24px;font-weight:600;line-height:1.25;color:${T.inkPrimary};">${escapeHtml(title)}</h1>
                    <p class="mpa-email-greeting" style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${T.inkPrimary};">${escapeHtml(greeting)}</p>
                    <div class="mpa-email-body">
                      ${bodyParagraphsHtml(body)}
                    </div>
                    ${ctaBlock}
                    <p class="mpa-email-meta" style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${T.inkSecondary};">${escapeHtml(secondaryNote)}</p>
                  </td>
                </tr>
                <tr>
                  <td class="mpa-email-footer" style="padding:20px 28px 28px;border-top:1px solid ${T.borderSubtle};font-family:${T.fontStack};">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${T.inkPrimary};">${escapeHtml(EMAIL_BRAND_TAGLINE)}</p>
                    <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${T.inkSecondary};">
                      Questions? Contact
                      <a href="mailto:${EMAIL_SUPPORT_ADDRESS}" style="color:${T.brandPrimary};text-decoration:none;">${EMAIL_SUPPORT_ADDRESS}</a>
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.5;color:${T.inkSecondary};">
                      © ${year} ${escapeHtml(EMAIL_BRAND_NAME)} · ${escapeHtml(EMAIL_BRAND_TAGLINE)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textParts = [
    title,
    "",
    greeting,
    "",
    body,
    ...(link ? ["", `${ctaLabel}: ${link}`] : []),
    "",
    secondaryNote,
    "",
    `Support: ${EMAIL_SUPPORT_ADDRESS}`,
    `${EMAIL_BRAND_TAGLINE} (${EMAIL_BRAND_NAME})`,
    `© ${year} ${EMAIL_BRAND_NAME}`
  ];

  return { subject, html, text: textParts.join("\n") };
}

/** @deprecated Prefer renderMpaEmail — kept as the workflow entry used by delivery.ts */
export function renderTransactionalEmail(input: {
  templateKey: EmailTemplateKey;
  subject: string;
  body: string;
  href?: string | null;
  recipientName?: string | null;
  title?: string | null;
  eyebrow?: string | null;
  ctaLabel?: string | null;
}): { subject: string; html: string; text: string } {
  return renderMpaEmail(input);
}

export function ctaLabelForTemplate(templateKey: EmailTemplateKey): string {
  return TEMPLATE_DEFAULTS[templateKey].ctaLabel;
}

export function eyebrowForTemplate(templateKey: EmailTemplateKey): string {
  return TEMPLATE_DEFAULTS[templateKey].eyebrow;
}

export function invitationEmailContent(input: {
  email: string;
  token: string;
  roles?: string[];
}): { subject: string; html: string; text: string } {
  const acceptPath = `/accept-invitation/${input.token}`;
  const roleLabel = input.roles?.length ? input.roles.join(", ") : "member";
  return renderMpaEmail({
    templateKey: "user_invitation",
    subject: "You're invited to My Property Assistant",
    title: "You're invited to M.P.A.",
    eyebrow: "Invitation",
    ctaLabel: "Accept invitation",
    body: `You have been invited to join an organization on My Property Assistant as ${roleLabel}.\n\nUse the button below to accept your invitation and get started.`,
    href: acceptPath,
    recipientName: null
  });
}

/**
 * Supabase Auth recovery template HTML (Go template placeholders).
 * Token handling remains Supabase Auth — presentation only (ADR-018 / EML-001).
 */
export function passwordResetAuthTemplateHtml(): string {
  const rendered = renderMpaEmail({
    templateKey: "password_reset",
    subject: "Reset your My Property Assistant password",
    title: "Reset your password",
    eyebrow: "Security",
    ctaLabel: "Reset password",
    body: "We received a request to reset the password for your My Property Assistant account.\n\nUse the button below to choose a new password. This link expires for your security.",
    rawHref: "{{ .ConfirmationURL }}",
    recipientName: null,
    secondaryNote: "If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged."
  });
  return rendered.html;
}
