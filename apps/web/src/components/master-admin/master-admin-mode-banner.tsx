"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { MasterAdminEffectiveSession } from "../../lib/master-admin/contracts";
import { PORTAL_ROLE_LABELS } from "../../lib/master-admin/contracts";

export function MasterAdminModeBanner({
  session,
  authenticatedName
}: {
  session: MasterAdminEffectiveSession;
  authenticatedName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    void fetch("/api/master-admin/impersonation/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pathname, eventType: "page_visit" })
    }).catch(() => undefined);
  }, [pathname]);

  async function exitSession() {
    if (pending) return;
    setPending(true);
    try {
      const response = await fetch("/api/master-admin/impersonation/end", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as { redirectTo?: string } | null;
      router.push(payload?.redirectTo ?? "/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const isTest = session.mode === "portal_test";
  const portalLabel =
    session.portal != null ? PORTAL_ROLE_LABELS[session.portal] : session.targetRoleLabel ?? "User";

  return (
    <div
      role="status"
      className="border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-status-warning-subtle,#FFF4E5)] px-4 py-2.5 text-[var(--mpa-color-text-primary)]"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-0.5 text-sm">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.12em]">
            {isTest ? "Master Admin Test Mode" : "Master Admin Impersonation"}
          </p>
          {isTest ? (
            <>
              <p>
                Viewing <span className="font-medium">{portalLabel} Portal</span>
              </p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                Actions are simulated unless explicitly committed.
              </p>
            </>
          ) : (
            <>
              <p>
                Logged in as:{" "}
                <span className="font-medium">
                  {session.targetDisplayName ?? "User"} ({session.targetRoleLabel ?? "Role"})
                </span>
              </p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                Authenticated as: {authenticatedName} (Master Admin)
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => void exitSession()}
          className="shrink-0 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--mpa-color-interactive-row-hover)] disabled:opacity-60"
        >
          {pending ? "Exiting…" : isTest ? "Exit Test Mode" : "Return to My Session"}
        </button>
      </div>
    </div>
  );
}
