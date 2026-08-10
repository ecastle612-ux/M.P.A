"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IMPERSONATION_TARGET_ROLE_LABELS, type ImpersonationTargetRole } from "@mpa/shared";
import { Button } from "@mpa/ui";

export function ImpersonationBanner({
  organizationName,
  targetRole,
  mode
}: {
  organizationName: string;
  targetRole: ImpersonationTargetRole;
  mode: "read_only" | "write_enabled";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onExit() {
    setBusy(true);
    try {
      await fetch("/api/admin/impersonation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" })
      });
      router.push("/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="status"
      className="sticky top-0 z-[60] border-b-2 border-[#7A2E0B] bg-[#F3D9C4] px-4 py-3 text-[#3D1F0A]"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            VIEW AS ACTIVE · {IMPERSONATION_TARGET_ROLE_LABELS[targetRole]} · {organizationName}
          </p>
          <p className="text-xs">
            {mode === "read_only"
              ? "Read-only support session — mutations are blocked. Every session is audited."
              : "Write-enabled support session — audited."}
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void onExit()}>
          {busy ? "Exiting…" : "Exit View As"}
        </Button>
      </div>
    </div>
  );
}
