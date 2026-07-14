"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button, Card, Input, Select } from "@mpa/ui";
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
          <Button disabled={loading} type="submit">
            {loading ? "Creating..." : "Create organization"}
          </Button>
        </form>
        {error ? <p className="mt-2 text-sm text-[#C0392B]">{error}</p> : null}
        {notice ? <p className="mt-2 text-sm text-[#0F6B56]">{notice}</p> : null}
        {hasOrganizations ? (
          <Button className="mt-4" variant="secondary" onClick={() => void refreshOrganizationDetails()}>
            Refresh organization details
          </Button>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
          Invitations and memberships
        </h2>
        <form className="mt-4 grid gap-2" onSubmit={handleInvite}>
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
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <p className="font-semibold text-[var(--mpa-color-text-primary)]">Pending invitations</p>
            {invitations.length === 0 ? (
              <p className="text-[var(--mpa-color-text-secondary)]">No invitations yet.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-[var(--mpa-color-text-secondary)]">
                {invitations.map((invitation) => (
                  <li key={invitation.id}>
                    {invitation.email} — {invitation.roles.join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="font-semibold text-[var(--mpa-color-text-primary)]">Memberships</p>
            {memberships.length === 0 ? (
              <p className="text-[var(--mpa-color-text-secondary)]">No memberships loaded.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-[var(--mpa-color-text-secondary)]">
                {memberships.map((membership) => (
                  <li key={membership.id}>
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
