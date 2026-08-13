"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  LAUNCH_INVITE_ROLES,
  isUserRole,
  toRoleDescription,
  toRoleLabel,
  type LaunchInviteRole
} from "@mpa/shared";
import { Button, Input, Select } from "@mpa/ui";
import { useOrganizationContext } from "../shell/organization-context";

type InvitationRow = {
  id: string;
  email: string;
  roles: string[];
  status: string;
  token: string;
  expires_at: string;
  email_status?: string;
  acceptUrl?: string | null;
};

type MembershipRow = {
  id: string;
  user_id: string;
  roles: string[];
  status: string;
};

function formatRoles(roles: string[]): string {
  return roles.map((role) => (isUserRole(role) ? toRoleLabel(role) : role)).join(", ");
}

export function TeamInvitePanel() {
  const { activeOrganization } = useOrganizationContext();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<LaunchInviteRole>("property_manager");
  const [invitations, setInvitations] = useState<InvitationRow[] | null>(null);
  const [memberships, setMemberships] = useState<MembershipRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastAcceptUrl, setLastAcceptUrl] = useState<string | null>(null);

  useEffect(() => {
    const organizationId = activeOrganization?.id;
    if (!organizationId) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const [invitationResponse, membershipResponse] = await Promise.all([
        fetch(`/api/organizations/${organizationId}/invitations`),
        fetch(`/api/organizations/${organizationId}/memberships`)
      ]);
      if (cancelled) {
        return;
      }
      if (!invitationResponse.ok || !membershipResponse.ok) {
        setInvitations([]);
        setMemberships([]);
        const status = !invitationResponse.ok
          ? invitationResponse.status
          : membershipResponse.status;
        setError(
          status === 403
            ? "You do not have permission to view team invitations for this organization."
            : "Unable to load team. Try Refresh team, or ask an Organization Admin."
        );
        return;
      }
      const invitationPayload = (await invitationResponse.json()) as {
        invitations?: InvitationRow[];
      };
      const membershipPayload = (await membershipResponse.json()) as {
        memberships?: MembershipRow[];
      };
      if (!cancelled) {
        setError(null);
        setInvitations(invitationPayload.invitations ?? []);
        setMemberships(membershipPayload.memberships ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeOrganization?.id]);

  async function refresh() {
    if (!activeOrganization) {
      return;
    }
    const [invitationResponse, membershipResponse] = await Promise.all([
      fetch(`/api/organizations/${activeOrganization.id}/invitations`),
      fetch(`/api/organizations/${activeOrganization.id}/memberships`)
    ]);
    if (!invitationResponse.ok || !membershipResponse.ok) {
      setInvitations([]);
      setMemberships([]);
      const status = !invitationResponse.ok
        ? invitationResponse.status
        : membershipResponse.status;
      setError(
        status === 403
          ? "You do not have permission to view team invitations for this organization."
          : "Unable to load team. Try again, or ask an Organization Admin."
      );
      return;
    }
    const invitationPayload = (await invitationResponse.json()) as {
      invitations?: InvitationRow[];
    };
    const membershipPayload = (await membershipResponse.json()) as {
      memberships?: MembershipRow[];
    };
    setError(null);
    setInvitations(invitationPayload.invitations ?? []);
    setMemberships(membershipPayload.memberships ?? []);
  }

  async function onInvite(event: FormEvent) {
    event.preventDefault();
    if (!activeOrganization) {
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    setLastAcceptUrl(null);

    const response = await fetch(`/api/organizations/${activeOrganization.id}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, roles: [role] })
    });
    const payload = (await response.json()) as {
      error?: string;
      notice?: string;
      acceptUrl?: string;
      invitation?: { acceptUrl?: string };
    };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Invitation failed");
      return;
    }

    setNotice(payload.notice ?? "Invitation created.");
    setLastAcceptUrl(payload.acceptUrl ?? payload.invitation?.acceptUrl ?? null);
    setEmail("");
    await refresh();
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Accept link copied.");
    } catch {
      setError("Could not copy link — select it manually.");
    }
  }

  if (!activeOrganization) {
    return (
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Select an organization before inviting teammates.
      </p>
    );
  }

  const loaded = invitations !== null && memberships !== null;

  return (
    <div className="space-y-6">
      <section className="max-w-xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5">
        <header className="space-y-1">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            Invite a teammate
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            One invitation experience. Assign a launch role; we email the accept link and show it
            here so nobody is blocked.
          </p>
        </header>
        <form className="space-y-3" onSubmit={onInvite}>
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="invite-email">
              Email
            </label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--mpa-color-text-secondary)]" htmlFor="invite-role">
              Role
            </label>
            <Select
              id="invite-role"
              value={role}
              onChange={(event) => setRole(event.target.value as LaunchInviteRole)}
            >
              {LAUNCH_INVITE_ROLES.map((inviteRole) => (
                <option key={inviteRole} value={inviteRole}>
                  {toRoleLabel(inviteRole)}
                </option>
              ))}
            </Select>
            <p
              className="text-xs text-[var(--mpa-color-text-secondary)]"
              data-testid="invite-role-description"
            >
              {toRoleDescription(role)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading || email.trim().length < 3}>
              {loading ? "Sending…" : "Send invitation"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => void refresh()}>
              Refresh team
            </Button>
          </div>
        </form>
        {lastAcceptUrl ? (
          <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] p-3 text-sm">
            <p className="font-medium text-[var(--mpa-color-text-primary)]">Accept link</p>
            <code className="block break-all text-xs text-[var(--mpa-color-text-secondary)]">
              {lastAcceptUrl}
            </code>
            <Button type="button" variant="secondary" onClick={() => void copyLink(lastAcceptUrl)}>
              Copy accept link
            </Button>
          </div>
        ) : null}
        {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
        {notice ? <p className="text-sm text-[#0F6B56]">{notice}</p> : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Pending invitations
          </h3>
          {!loaded ? (
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">Loading invitations…</p>
          ) : invitations.filter((row) => row.status === "pending").length === 0 ? (
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">None pending.</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {invitations
                .filter((row) => row.status === "pending")
                .map((invitation) => (
                  <li
                    key={invitation.id}
                    className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2"
                  >
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {formatRoles(invitation.roles)} · email {invitation.email_status ?? "pending"}
                    </p>
                    {invitation.acceptUrl ? (
                      <Button
                        className="mt-2"
                        type="button"
                        variant="secondary"
                        onClick={() => void copyLink(invitation.acceptUrl as string)}
                      >
                        Copy accept link
                      </Button>
                    ) : null}
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Organization team
          </h3>
          {!loaded ? (
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">Loading memberships…</p>
          ) : memberships.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No memberships loaded.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
              {memberships.map((membership) => (
                <li key={membership.id}>
                  <span className="font-mono text-xs">{membership.user_id.slice(0, 8)}…</span>
                  {" — "}
                  {formatRoles(membership.roles)} ({membership.status})
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
