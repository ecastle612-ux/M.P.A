import type { ReactNode } from "react";
import { Breadcrumbs } from "../shell/breadcrumbs";

export function AppPage({
  breadcrumbs,
  children,
  wide = true
}: {
  breadcrumbs?: Array<{ href?: string; label: string }>;
  children: ReactNode;
  /** When true (default), uses fluid enterprise workspace width. */
  wide?: boolean;
}) {
  return (
    <main className={wide ? "mpa-page-wide flex-1 space-y-5" : "mpa-page flex-1 space-y-5"}>
      {breadcrumbs ? (
        <div className="mb-4">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      ) : null}
      {children}
    </main>
  );
}
