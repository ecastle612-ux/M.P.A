export type FoundationEmailTemplateProps = {
  title: string;
  previewText?: string;
  body: string;
};

/**
 * Foundation email renderer placeholder. Business templates
 * should be added in later phases.
 */
export function renderFoundationEmail(props: FoundationEmailTemplateProps): string {
  const preview = props.previewText ? `<p>${props.previewText}</p>` : "";
  return `<html><body><h1>${props.title}</h1>${preview}<div>${props.body}</div></body></html>`;
}
