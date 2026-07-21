"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Card, Input } from "@mpa/ui";
import { useOrganizationContext } from "../shell/organization-context";
import { BrandLogo } from "../branding/brand-logo";

export function OrganizationFoundationPanel() {
  const { activeOrganization, organizations, refreshOrganizations } = useOrganizationContext();
  const [newOrganizationName, setNewOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeOrganizationLabel = useMemo(() => {
    if (!activeOrganization) {
      return "No active organization";
    }
    return `${activeOrganization.name} (${activeOrganization.slug})`;
  }, [activeOrganization]);

  async function handleCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const response = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newOrganizationName })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Organization creation failed");
      return;
    }

    setNewOrganizationName("");
    await refreshOrganizations();
    setNotice("Organization created. Continue in Settings → Team to invite staff.");
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          Create organization
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Active context: {activeOrganizationLabel}
        </p>
        <form className="mt-4 space-y-3" onSubmit={(event) => void handleCreateOrganization(event)}>
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="organization-name">
            Organization name
          </label>
          <Input
            id="organization-name"
            placeholder="Example Property Group"
            required
            value={newOrganizationName}
            onChange={(event) => setNewOrganizationName(event.target.value)}
          />
          <Button disabled={loading} type="submit">
            {loading ? "Creating..." : "Create organization"}
          </Button>
        </form>
        {error ? <p className="mt-2 text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
        {notice ? <p className="mt-2 text-sm text-[var(--mpa-color-brand-primary)]">{notice}</p> : null}
        {organizations.length > 0 ? (
          <p className="mt-4 text-sm text-[var(--mpa-color-text-secondary)]">
            You already have {organizations.length} organization
            {organizations.length === 1 ? "" : "s"}. Manage details in Settings.
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Team management</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Invite staff, review roles, and manage memberships in Settings. This onboarding card only
          creates your organization.
        </p>
        {activeOrganization ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/settings/team"
              className="text-sm font-medium text-[var(--mpa-color-brand-primary)] underline-offset-2 hover:underline"
            >
              Open Settings → Team
            </Link>
            <Link
              href="/settings/organization"
              className="text-sm font-medium text-[var(--mpa-color-brand-primary)] underline-offset-2 hover:underline"
            >
              Organization
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-3">
            <BrandLogo purpose="sidebar" collapsed />
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Create an organization first, then invite your team from Settings.
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}
