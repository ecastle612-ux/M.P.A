"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button, Card, EmptyState, Input, Select } from "@mpa/ui";
import { USER_ROLES, isUserRole } from "@mpa/shared";
import { useOrganizationContext } from "../shell/organization-context";

type PendingInvitation = {
  id: string;
  organization_id: string;
  email: string;
  roles: string[];
  status: "pending" | "accepted" | "revoked" | "expired";
  token: string;
  expires_at: string;
};

type Membership = {
  id: string;
  user_id: string;
  roles: string[];
  status: "active" | "inactive";
};

export function OrganizationFoundationPanel() {
  const { activeOrganization, organizations, refreshOrganizations } = useOrganizationContext();
  const [newOrganizationName, setNewOrganizationName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("tenant");
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
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

  async function refreshOrganizationDetails() {
    if (!activeOrganization) {
      setInvitations([]);
      setMemberships([]);
      return;
    }

    const [invitationResponse, membershipResponse] = await Promise.all([
      fetch(`/api/organizations/${activeOrganization.id}/invitations`, { method: "GET" }),
      fetch(`/api/organizations/${activeOrganization.id}/memberships`, { method: "GET" })
    ]);

    if (invitationResponse.ok) {
      const invitationPayload = (await invitationResponse.json()) as { invitations?: PendingInvitation[] };
      setInvitations(invitationPayload.invitations ?? []);
    }

    if (membershipResponse.ok) {
      const membershipPayload = (await membershipResponse.json()) as { memberships?: Membership[] };
      setMemberships(membershipPayload.memberships ?? []);
    }
  }

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
    await refreshOrganizationDetails();
    setNotice("Organization created.");
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrganization || !isUserRole(inviteRole)) {
      return;
    }
    setError(null);
    setNotice(null);
    setLoading(true);

    const response = await fetch(`/api/organizations/${activeOrganization.id}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        roles: [inviteRole]
      })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Invitation failed");
      return;
    }

    setInviteEmail("");
    await refreshOrganizationDetails();
    setNotice("Invitation created.");
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            Organization foundation
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Active context: {activeOrganizationLabel}
          </p>
        </div>
        <form className="space-y-3" onSubmit={handleCreateOrganization}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--mpa-color-text-secondary)]" htmlFor="organization-name">
              Create organization
            </label>
            <Input
              id="organization-name"
              placeholder="Example Property Group"
              required
              value={newOrganizationName}
              onChange={(event) => setNewOrganizationName(event.target.value)}
            />
          </div>
          <Button disabled={loading} type="submit">
            {loading ? "Creating..." : "Create organization"}
          </Button>
        </form>
        {error ? (
          <p className="text-sm text-[var(--mpa-color-text-danger)]" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="text-sm text-[var(--mpa-color-status-success)]" role="status">
            {notice}
          </p>
        ) : null}
        {hasOrganizations ? (
          <Button variant="secondary" onClick={() => void refreshOrganizationDetails()}>
            Refresh organization details
          </Button>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            Invitations and memberships
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Invite members and review active memberships for the current organization.
          </p>
        </div>
        <form className="grid gap-3" onSubmit={handleInvite}>
          <Input
            type="email"
            placeholder="member@organization.com"
            required
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            disabled={!activeOrganization}
          />
          <Select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value)}
            disabled={!activeOrganization}
          >
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
          <Button disabled={loading || !activeOrganization} type="submit">
            Invite member
          </Button>
        </form>
        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-[var(--mpa-color-text-primary)]">Pending invitations</p>
            {invitations.length === 0 ? (
              <EmptyState
                title="No invitations yet"
                description="Invite a teammate to populate this list."
                className="bg-[var(--mpa-color-bg-surface-muted)] py-5"
              />
            ) : (
              <ul className="space-y-1 text-[var(--mpa-color-text-secondary)]">
                {invitations.map((invitation) => (
                  <li
                    key={invitation.id}
                    className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] px-3 py-2"
                  >
                    {invitation.email} — {invitation.roles.join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-[var(--mpa-color-text-primary)]">Memberships</p>
            {memberships.length === 0 ? (
              <p className="text-[var(--mpa-color-text-secondary)]">No memberships loaded.</p>
            ) : (
              <ul className="space-y-1 text-[var(--mpa-color-text-secondary)]">
                {memberships.map((membership) => (
                  <li
                    key={membership.id}
                    className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] px-3 py-2"
                  >
                    {membership.user_id} — {membership.roles.join(", ")} ({membership.status})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}
