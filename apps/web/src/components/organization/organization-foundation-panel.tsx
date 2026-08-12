"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { buttonClassName, Alert, Button, Card, Input } from "@mpa/ui";
import { useOrganizationContext } from "../shell/organization-context";

export function OrganizationFoundationPanel() {
  const { activeOrganization, organizations, refreshOrganizations } = useOrganizationContext();
  const [newOrganizationName, setNewOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasOrganizations = organizations.length > 0;

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
    setNotice("Organization created with Property Manager.");
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          Organization foundation
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Active context: {activeOrganizationLabel}
        </p>
        <form className="mt-4 space-y-3" onSubmit={handleCreateOrganization}>
          <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="organization-name">
            Create organization
          </label>
          <Input
            id="organization-name"
            placeholder="Example Property Group"
            required
            value={newOrganizationName}
            onChange={(event) => setNewOrganizationName(event.target.value)}
          />
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Product: Property Manager — assigned at create. Plan changes are operator-only.
          </p>
          <Button disabled={loading} type="submit">
            {loading ? "Creating..." : "Create organization"}
          </Button>
        </form>
        {error ? (
          <Alert variant="danger" className="mt-2">
            {error}
          </Alert>
        ) : null}
        {notice ? (
          <Alert variant="success" className="mt-2">
            {notice}
          </Alert>
        ) : null}
        {hasOrganizations ? (
          <p className="mt-4 text-xs text-[var(--mpa-color-text-secondary)]">
            {organizations.length} organization{organizations.length === 1 ? "" : "s"} available.
          </p>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Team</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Invitations live in one place — Team settings — so nobody uses a second invite flow.
        </p>
        <Link
          href="/settings/team"
          className={buttonClassName({ className: "mt-4" })}
        >
          Open Team invitations
        </Link>
      </Card>
    </section>
  );
}
