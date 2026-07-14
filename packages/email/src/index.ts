export type FoundationEmailTemplateProps = {
  title: string;
  previewText?: string;
  body: string;
  logoUrl?: string;
};

/**
 * Foundation email renderer placeholder. Business templates
 * should be added in later phases.
 */
export function renderFoundationEmail(props: FoundationEmailTemplateProps): string {
  const preview = props.previewText ? `<p>${props.previewText}</p>` : "";
  const logoUrl = props.logoUrl ?? "/branding/MPA%20logo.png";
  const header = `<div style="padding-bottom:16px;border-bottom:1px solid #E5E7EB;margin-bottom:16px;"><img src="${logoUrl}" alt="M.P.A. logo" style="width:180px;height:auto;display:block;" /></div>`;
  return `<html><body>${header}<h1>${props.title}</h1>${preview}<div>${props.body}</div></body></html>`;
}
