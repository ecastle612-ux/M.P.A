import type { ReactNode } from "react";
import { MPA_BRAND_NAME, MPA_BRAND_TAGLINE } from "../../lib/branding";
import { MpaLogo } from "./mpa-logo";

export function AuthBrandShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <MpaLogo priority className="h-24 w-auto sm:h-28" alt={`${MPA_BRAND_NAME} logo`} />
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">{MPA_BRAND_TAGLINE}</p>
      </div>
      {children}
    </div>
  );
}
