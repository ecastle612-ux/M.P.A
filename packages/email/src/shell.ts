export const MPA_EMAIL_PRODUCTION_ORIGIN = "https://www.my-property-assistant.com";
export const MPA_EMAIL_LOGO_PATH = "/branding/logo-dark.png";
export const MPA_EMAIL_BRAND_NAME = "M.P.A.";
export const MPA_EMAIL_BRAND_TAGLINE = "My Property Assistant";

const INK = "#12151A";
const GREY_TEXT = "#4B5563";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";
const PAGE_BG = "#F3F4F6";
const CARD_BG = "#FFFFFF";
const CTA_BG = "#0F6B56";
const CTA_TEXT = "#FFFFFF";
const FONT = 'Arial, Helvetica, sans-serif';

export type BrandedEmailProps = {
  title: string;
  previewText?: string;
  bodyHtml: string;
  ctaUrl?: string;
  ctaLabel?: string;
  logoUrl?: string;
  year?: number;
};

export function resolvePublicBrandOrigin(appUrl?: string | null): string {
  try {
    if (!appUrl) {
      return MPA_EMAIL_PRODUCTION_ORIGIN;
    }
    const parsed = new URL(appUrl);
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local") ||
      host.includes("vercel.app")
    ) {
      return MPA_EMAIL_PRODUCTION_ORIGIN;
    }
    return parsed.origin;
  } catch {
    return MPA_EMAIL_PRODUCTION_ORIGIN;
  }
}

export function resolveEmailLogoUrl(appUrl?: string | null): string {
  return `${resolvePublicBrandOrigin(appUrl)}${MPA_EMAIL_LOGO_PATH}`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function paragraphsToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 16px 0;">${escapeHtml(block).replaceAll("\n", "<br/>")}</p>`)
    .join("");
}

/**
 * Email-client-safe branded shell: table layout, inline CSS, no remote fonts, no animation.
 * Logo uses a Production-safe hosted asset; text fallback remains if images are blocked.
 */
export function renderBrandedEmail(props: BrandedEmailProps): string {
  const logoUrl = props.logoUrl ?? resolveEmailLogoUrl(process.env["NEXT_PUBLIC_APP_URL"]);
  const year = props.year ?? new Date().getFullYear();
  const preview = props.previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(props.previewText)}</div>`
    : "";
  const cta =
    props.ctaUrl && props.ctaLabel
      ? renderCta(props.ctaUrl, props.ctaLabel)
      : "";
  const fallback =
    props.ctaUrl
      ? `<p style="margin:24px 0 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">If the button does not work, copy this link:<br/><a href="${escapeHtml(props.ctaUrl)}" style="color:${CTA_BG};word-break:break-all;">${escapeHtml(props.ctaUrl)}</a></p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(props.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};">
  ${preview}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAGE_BG};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="padding:0 8px 20px 8px;">
              <img src="${escapeHtml(logoUrl)}" width="168" alt="M.P.A. — My Property Assistant" style="display:block;border:0;height:auto;max-width:168px;" />
              <p style="margin:8px 0 0 0;font-family:${FONT};font-size:13px;line-height:18px;color:${MUTED};">${MPA_EMAIL_BRAND_NAME} · ${MPA_EMAIL_BRAND_TAGLINE}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:${CARD_BG};border:1px solid ${BORDER};border-radius:8px;padding:32px 28px;">
              <h1 style="margin:0 0 16px 0;font-family:${FONT};font-size:22px;line-height:28px;font-weight:700;color:${INK};">${escapeHtml(props.title)}</h1>
              <div style="font-family:${FONT};font-size:16px;line-height:24px;color:${GREY_TEXT};">${props.bodyHtml}</div>
              ${cta}
              ${fallback}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0 8px;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">
              <p style="margin:0 0 6px 0;">${MPA_EMAIL_BRAND_TAGLINE} / ${MPA_EMAIL_BRAND_NAME}</p>
              <p style="margin:0 0 6px 0;">Questions? Reply to this email or visit <a href="${MPA_EMAIL_PRODUCTION_ORIGIN}" style="color:${CTA_BG};">${MPA_EMAIL_PRODUCTION_ORIGIN.replace("https://", "")}</a>.</p>
              <p style="margin:0;">© ${year} ${MPA_EMAIL_BRAND_TAGLINE}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderCta(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0 0;">
    <tr>
      <td align="center" bgcolor="${CTA_BG}" style="border-radius:6px;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:700;color:${CTA_TEXT};text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}
