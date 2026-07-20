"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Input } from "@mpa/ui";
import { useOrganizationContext } from "../shell/organization-context";

export type OrganizationSettingsDetails = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export function OrganizationSettingsPanel({
  initialOrganization,
  canManage
}: {
  initialOrganization: OrganizationSettingsDetails | null;
  canManage: boolean;
}) {
  const { activeOrganization, refreshOrganizations } = useOrganizationContext();
  const [details, setDetails] = useState(initialOrganization);
  const [name, setName] = useState(initialOrganization?.name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!activeOrganization || !details) {
    return (
      <Card>
        <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          No active organization
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Create or select an organization before managing settings.
        </p>
      </Card>
    );
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrganization || !canManage) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    const response = await fetch(`/api/organizations/${activeOrganization.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const payload = (await response.json()) as {
      organization?: OrganizationSettingsDetails;
      error?: string;
    };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to update organization");
      return;
    }

    if (payload.organization) {
      setDetails(payload.organization);
      setName(payload.organization.name);
    }
    await refreshOrganizations();
    setNotice("Organization information saved.");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            Organization
          </h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Permanent organization identity for your Design Partner workspace.
          </p>
        </div>
        <form className="space-y-3" onSubmit={(event) => void handleSave(event)}>
          <label className="block text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="org-name">
            Organization name
          </label>
          <Input
            id="org-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!canManage || loading}
            required
            minLength={2}
            maxLength={120}
          />
          {canManage ? (
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save organization"}
            </Button>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              You can view organization details. A property manager must update the name.
            </p>
          )}
        </form>
        {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
        {notice ? <p className="text-sm text-[var(--mpa-color-brand-primary)]">{notice}</p> : null}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Details</h2>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-[var(--mpa-color-text-tertiary)]">Slug</dt>
            <dd className="font-medium text-[var(--mpa-color-text-primary)]">{details.slug}</dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-tertiary)]">Organization ID</dt>
            <dd className="break-all font-mono text-xs text-[var(--mpa-color-text-secondary)]">
              {details.id}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--mpa-color-text-tertiary)]">Created</dt>
            <dd className="text-[var(--mpa-color-text-secondary)]">
              {new Date(details.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
