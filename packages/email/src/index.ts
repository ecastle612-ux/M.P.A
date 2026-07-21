import { resolveBrandAssetUrl, type BrandLogoTone, type BrandSurfaceTone } from "../../shared/src/branding";

export type FoundationEmailTemplateProps = {
  title: string;
  previewText?: string;
  body: string;
  logoUrl?: string;
  logoTone?: BrandLogoTone;
};

/**
 * Foundation email renderer placeholder. Business templates
 * should be added in later phases.
 * BR-001: logo path/size come from resolveBrandAssetUrl("email", …).
 */
export function renderFoundationEmail(props: FoundationEmailTemplateProps): string {
  const preview = props.previewText ? `<p>${props.previewText}</p>` : "";
  const surfaceTone: BrandSurfaceTone =
    props.logoTone === "dark-surface" || props.logoTone === "light-surface"
      ? props.logoTone
      : "light-surface";
  const brand = resolveBrandAssetUrl("email", surfaceTone);
  const logoUrl = props.logoUrl ?? brand.src;
  const header = `<div style="padding-bottom:16px;border-bottom:1px solid #E5E7EB;margin-bottom:16px;"><img src="${logoUrl}" alt="M.P.A. logo" style="width:${brand.width}px;height:auto;display:block;" /></div>`;
  return `<html><body>${header}<h1>${props.title}</h1>${preview}<div>${props.body}</div></body></html>`;
}
