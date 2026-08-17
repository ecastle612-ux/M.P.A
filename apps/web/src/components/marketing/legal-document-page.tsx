import {
  PUBLIC_LEGAL_EFFECTIVE_DATE,
  PUBLIC_LEGAL_SERVICE_NAME,
  type LegalSection
} from "../../lib/legal/public-legal-copy";
import { MarketingChrome, marketingNarrowMainClass } from "./marketing-chrome";
import { PublicLegalLinks } from "./public-legal-links";

export function LegalDocumentPage({
  isAuthenticated,
  title,
  intro,
  sections
}: {
  isAuthenticated: boolean;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className={marketingNarrowMainClass}>
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            {PUBLIC_LEGAL_SERVICE_NAME}
          </p>
          <h1 className="font-display text-3xl font-semibold">{title}</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Effective {PUBLIC_LEGAL_EFFECTIVE_DATE}
          </p>
          <p className="text-sm leading-7 text-[var(--mpa-color-text-secondary)]">{intro}</p>
        </header>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="font-display text-xl font-semibold">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-7 text-[var(--mpa-color-text-secondary)]"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <PublicLegalLinks className="flex flex-wrap gap-4 text-sm text-[var(--mpa-color-text-secondary)]" />
      </main>
    </MarketingChrome>
  );
}
