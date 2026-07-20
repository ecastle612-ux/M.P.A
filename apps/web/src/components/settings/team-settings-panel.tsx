"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Input, Select } from "@mpa/ui";
import { isUserRole, type UserRole } from "@mpa/shared";
import { useOrganizationContext } from "../shell/organization-context";
import {
  ROLE_PERMISSION_SUMMARIES,
  STAFF_INVITE_ROLES,
  formatRoleLabel
} from "../../lib/organization/role-summaries";

export type TeamPendingInvitation = {
  id: string;
  email: string;
  roles: string[];
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
};

export type TeamMembership = {
  id: string;
  user_id: string;
  roles: string[];
  status: "active" | "inactive";
  display_name?: string | null;
  contact_email?: string | null;
};

export function TeamSettingsPanel({
  initialInvitations,
  initialMemberships,
  canUpdate
}: {
  initialInvitations: TeamPendingInvitation[];
  initialMemberships: TeamMembership[];
  canUpdate: boolean;
}) {
  const { activeOrganization } = useOrganizationContext();
  const [invitations, setInvitations] = useState(
    initialInvitations.filter((item) => item.status === "pending")
  );
  const [memberships, setMemberships] = useState(initialMemberships);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("property_manager");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    if (!activeOrganization) return;

    const [invitationResponse, membershipResponse] = await Promise.all([
      fetch(`/api/organizations/${activeOrganization.id}/invitations`),
      fetch(`/api/organizations/${activeOrganization.id}/memberships`)
    ]);

    if (invitationResponse.ok) {
      const payload = (await invitationResponse.json()) as { invitations?: TeamPendingInvitation[] };
      setInvitations((payload.invitations ?? []).filter((item) => item.status === "pending"));
    }

    if (membershipResponse.ok) {
      const payload = (await membershipResponse.json()) as { memberships?: TeamMembership[] };
      setMemberships(payload.memberships ?? []);
    }
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrganization || !isUserRole(inviteRole)) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    const response = await fetch(`/api/organizations/${activeOrganization.id}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, roles: [inviteRole] })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Invitation failed");
      return;
    }

    setInviteEmail("");
    await refresh();
    setNotice("Invitation sent. Pending invitations appear below until accepted.");
  }

  async function setMembershipStatus(membershipId: string, status: "active" | "inactive") {
    if (!activeOrganization || !canUpdate) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    const response = await fetch(`/api/organizations/${activeOrganization.id}/memberships`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId, status })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to update membership");
      return;
    }

    await refresh();
    setNotice(status === "inactive" ? "Member deactivated." : "Member reactivated.");
  }

  async function updateMembershipRoles(membershipId: string, roles: UserRole[]) {
    if (!activeOrganization || !canUpdate || roles.length === 0) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    const response = await fetch(`/api/organizations/${activeOrganization.id}/memberships`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId, roles })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to update roles");
      return;
    }

    await refresh();
    setNotice("Roles updated.");
  }

  if (!activeOrganization) {
    return (
      <Card>
        <h1 className="font-display text-xl font-semibold">Team</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Select an organization to manage team members.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">Team</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Invite staff, review roles and permissions, and deactivate access when someone leaves.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-base font-semibold">Invite staff</h2>
          <form
            className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
            onSubmit={(event) => void handleInvite(event)}
          >
            <Input
              type="email"
              required
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              disabled={!canUpdate || loading}
              aria-label="Staff email"
            />
            <Select
              value={inviteRole}
              onChange={(event) => {
                if (isUserRole(event.target.value)) setInviteRole(event.target.value);
              }}
              disabled={!canUpdate || loading}
              aria-label="Staff role"
            >
              {STAFF_INVITE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {formatRoleLabel(role)}
                </option>
              ))}
            </Select>
            <Button type="submit" disabled={!canUpdate || loading}>
              Invite
            </Button>
          </form>
          {!canUpdate ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              You can view the team. Inviting or deactivating members requires manager permissions.
            </p>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-semibold">Pending invitations</h2>
          {invitations.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No pending invitations.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
                >
                  <p className="font-medium">{invitation.email}</p>
                  <p className="text-[var(--mpa-color-text-secondary)]">
                    {invitation.roles.map(formatRoleLabel).join(", ")} · expires{" "}
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Members</h2>
        {memberships.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No memberships loaded.</p>
        ) : (
          <ul className="divide-y divide-[var(--mpa-color-border-default)]">
            {memberships.map((membership) => {
              const label =
                membership.display_name?.trim() ||
                membership.contact_email?.trim() ||
                `Member ${membership.user_id.slice(0, 8)}`;
              const primaryRole = (membership.roles[0] ?? "property_manager") as UserRole;
              return (
                <li
                  key={membership.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{label}</p>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {membership.roles.map(formatRoleLabel).join(", ")} · {membership.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canUpdate ? (
                      <Select
                        aria-label={`Role for ${label}`}
                        value={primaryRole}
                        disabled={loading}
                        onChange={(event) => {
                          if (!isUserRole(event.target.value)) return;
                          void updateMembershipRoles(membership.id, [event.target.value]);
                        }}
                      >
                        {STAFF_INVITE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {formatRoleLabel(role)}
                          </option>
                        ))}
                      </Select>
                    ) : null}
                    {canUpdate ? (
                      membership.status === "active" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={loading}
                          onClick={() => void setMembershipStatus(membership.id, "inactive")}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={loading}
                          onClick={() => void setMembershipStatus(membership.id, "active")}
                        >
                          Reactivate
                        </Button>
                      )
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Roles & permissions</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Permissions follow the platform role model. Custom ACL editing will become available during a
          future release.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(ROLE_PERMISSION_SUMMARIES) as UserRole[]).map((role) => {
            const summary = ROLE_PERMISSION_SUMMARIES[role];
            return (
              <div
                key={role}
                className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-3"
              >
                <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{summary.label}</p>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{summary.summary}</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[var(--mpa-color-text-secondary)]">
                  {summary.capabilities.map((capability) => (
                    <li key={capability}>{capability}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>

      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-brand-primary)]">{notice}</p> : null}
    </div>
  );
}
