"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  IMPERSONATION_TARGET_ROLE_LABELS,
  IMPERSONATION_TARGET_ROLES,
  type ImpersonationTargetRole
} from "@mpa/shared";
import { Button, Input, Select } from "@mpa/ui";
import { OpsWorkspaceChrome } from "./ops-workspace-chrome";

type OrgOption = { id: string; name: string };

export function ViewAsConsole({ organizations }: { organizations: OrgOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [organizationId, setOrganizationId] = useState(
    () => searchParams.get("orgId") ?? organizations[0]?.id ?? ""
  );
  const [targetRole, setTargetRole] = useState<ImpersonationTargetRole>("property_manager");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onStart() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/impersonation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          organizationId,
          targetRole,
          reason: reason.trim() || undefined
        })
      });
      const body = (await response.json()) as { error?: string; homeHref?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to start View As");
      router.push(body.homeHref ?? "/pm/mission-control");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start View As");
      setBusy(false);
    }
  }

  return (
    <OpsWorkspaceChrome
      eyebrow="Owner Operations · View As"
      title="View As (secure impersonation)"
      description="Enter a customer experience to diagnose support issues. Sessions are read-only by default, audited, and show a persistent banner with one-click exit."
    >
      <section className="max-w-xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5">
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Supported roles: Property Manager, Organization Owner, Facility Manager, Technician, Resident.
        </p>
        {error ? (
          <p className="text-sm text-[var(--mpa-color-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="view-as-org">
            Organization
          </label>
          <Select
            id="view-as-org"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            required
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="view-as-role">
            View as role
          </label>
          <Select
            id="view-as-role"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as ImpersonationTargetRole)}
          >
            {IMPERSONATION_TARGET_ROLES.map((role) => (
              <option key={role} value={role}>
                {IMPERSONATION_TARGET_ROLE_LABELS[role]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="view-as-reason">
            Support reason (audited)
          </label>
          <Input
            id="view-as-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Customer reported billing issue…"
          />
        </div>
        <Button type="button" disabled={busy || !organizationId} onClick={() => void onStart()}>
          {busy ? "Starting…" : "Start View As (read-only)"}
        </Button>
      </section>
    </OpsWorkspaceChrome>
  );
}
