import { BrandLogo } from "./brand-logo";
import { BrandSurfaceTone } from "./brand-surface-tone";
import type { BrandSurfaceTone as BrandSurfaceToneValue } from "../../lib/branding";

/**
 * Theme-locked workspace / auth loading mark.
 * Always pass the resolved surface so the logo matches light (default) or dark mode.
 */
export function BrandedLoadingScreen({
  tone,
  message
}: {
  tone: BrandSurfaceToneValue;
  message: string;
}) {
  return (
    <BrandSurfaceTone tone={tone}>
      <main
        data-brand-surface={tone}
        className="flex min-h-screen items-center justify-center bg-[var(--mpa-color-bg-app)] p-6"
      >
        <div className="mpa-brand-loading flex flex-col items-center gap-4 text-center">
          <BrandLogo purpose="loading" priority decorative />
          <p className="text-sm font-medium text-[var(--mpa-color-text-secondary)]">{message}</p>
        </div>
      </main>
    </BrandSurfaceTone>
  );
}
