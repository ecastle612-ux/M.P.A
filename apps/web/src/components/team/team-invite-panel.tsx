"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  defaultLaunchInviteRoleForSku,
  derivedOperatingPositionLabel,
  isMemberOperatingScope,
  isUserRole,
  launchInviteRolesForSku,
  MEMBER_OPERATING_SCOPES,
  primaryRole,
  toInviteRoleDescription,
  toInviteRoleLabel,
  toOperatingScopeLabel,
  toRoleLabel,
  type LaunchInviteRole,
  type MemberOperatingScope,
  type ProductSku
} from "@mpa/shared";
import { Alert, Button, FormField, Input, Select, useToast } from "@mpa/ui";
import { useOrganizationContext } from "../shell/organization-context";
import { useCommercialContext } from "../shell/commercial-context";

type InvitationRow = {
  id: string;
  email: string;
  roles: string[];
  status: string;
  token: string;
  expires_at: string;
  emailStatus?: string;
  delivery_status?: string;
  acceptUrl?: string | null;
  operating_scope?: string | null;
};

type MembershipRow = {
  id: string;
  user_id: string;
  roles: string[];
  status: string;
  operating_scope?: string | null;
};

function formatRoles(roles: string[]): string {
  return roles.map((role) => (isUserRole(role) ? toRoleLabel(role) : role)).join(", ");
}

function formatInvitationEmailState(status: string | null | undefined): string {
  if (status === "sent") {
    return "Email sent";
  }
  if (status === "failed") {
    return "Email failed";
  }
  return "Email pending";
}

function formatScope(scope: string | null | undefined, sku: ProductSku | null): string {
  if (sku !== "mpa_complete_platform") {
    return "";
  }
  if (!scope) {
    return "Needs operational responsibility (currently has both)";
  }
  return isMemberOperatingScope(scope) ? toOperatingScopeLabel(scope) : scope;
}

export function TeamInvitePanel() {
  const { notify } = useToast();
  const { activeOrganization } = useOrganizationContext();
  const { productSku } = useCommercialContext();
  const inviteRoles = useMemo(() => launchInviteRolesForSku(productSku), [productSku]);
  const defaultRole = useMemo(
    () => defaultLaunchInviteRoleForSku(productSku),
    [productSku]
  );
  const [email, setEmail] = useState("");
  const [roleOverride, setRoleOverride] = useState<LaunchInviteRole | null>(null);
  const role = roleOverride ?? defaultRole;
  const [invitations, setInvitations] = useState<InvitationRow[] | null>(null);
  const [memberships, setMemberships] = useState<MembershipRow[] | null>(null);
  const [canUpdateMemberships, setCanUpdateMemberships] = useState(false);
  const [pendingDeactivateId, setPendingDeactivateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastAcceptUrl, setLastAcceptUrl] = useState<string | null>(null);
  const [operatingScope, setOperatingScope] = useState<MemberOperatingScope | "">("");
  const isComplete = productSku === "mpa_complete_platform";
  const staffInvite = role !== "vendor" && role !== "property_owner";
  const scopeOptions: MemberOperatingScope[] =
    role === "leasing_agent" ? ["property_operations"] : [...MEMBER_OPERATING_SCOPES];
  const inviteOperatingScope: MemberOperatingScope | "" =
    role === "leasing_agent" ? "property_operations" : operatingScope;

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
        canUpdateMemberships?: boolean;
      };
      if (!cancelled) {
        setError(null);
        setInvitations(invitationPayload.invitations ?? []);
        setMemberships(membershipPayload.memberships ?? []);
        setCanUpdateMemberships(Boolean(membershipPayload.canUpdateMemberships));
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
      canUpdateMemberships?: boolean;
    };
    setError(null);
    setInvitations(invitationPayload.invitations ?? []);
    setMemberships(membershipPayload.memberships ?? []);
    setCanUpdateMemberships(Boolean(membershipPayload.canUpdateMemberships));
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
      body: JSON.stringify({
        email,
        roles: [role],
        ...(isComplete && staffInvite && inviteOperatingScope
          ? { operatingScope: inviteOperatingScope }
          : {})
      })
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
    notify({
      variant: "success",
      title: "Invitation sent",
      description: payload.notice ?? "They can accept from email and sign in through the browser."
    });
    setLastAcceptUrl(payload.acceptUrl ?? payload.invitation?.acceptUrl ?? null);
    setEmail("");
    setOperatingScope("");
    await refresh();
  }

  async function updateMembershipScope(membershipId: string, nextScope: MemberOperatingScope) {
    if (!activeOrganization) {
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/organizations/${activeOrganization.id}/memberships`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId, operatingScope: nextScope })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not update operational responsibility.");
      return;
    }
    setNotice("Operational responsibility updated.");
    await refresh();
  }

  async function deactivateMembership(membershipId: string) {
    if (!activeOrganization) {
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/organizations/${activeOrganization.id}/memberships`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId, status: "inactive" })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    setPendingDeactivateId(null);
    if (!response.ok) {
      const message = payload.error ?? "Could not deactivate this teammate.";
      setError(message);
      notify({
        variant: "danger",
        title: "Deactivate failed",
        description: message
      });
      return;
    }
    setNotice("Teammate deactivated. Their membership record is retained.");
    notify({
      variant: "success",
      title: "Teammate deactivated",
      description: "They no longer have access. Their membership record is retained."
    });
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
  const isFo = productSku === "mpa_facility_operations";

  return (
    <div className="space-y-6">
      <section className="max-w-xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5">
        <header className="space-y-1">
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
            {isFo ? "Invite facility teammates" : "Invite a teammate"}
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {isFo
              ? "Facility Operations invites — start with Facility Technicians, then Facility Managers or vendors as needed."
              : "One invitation experience. Assign a launch role; we email the accept link and show it here so nobody is blocked."}
          </p>
        </header>
        <form className="space-y-4" onSubmit={onInvite}>
          <FormField id="invite-email" label="Email" required>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
              autoComplete="email"
            />
          </FormField>
          <FormField
            id="invite-role"
            label="Role"
            required
            hint={toInviteRoleDescription(role, productSku)}
          >
            <Select
              id="invite-role"
              value={role}
              onChange={(event) => {
                const nextRole = event.target.value as LaunchInviteRole;
                setRoleOverride(nextRole);
                if (nextRole === "leasing_agent") {
                  setOperatingScope("property_operations");
                }
              }}
              data-testid="invite-role-select"
            >
              {inviteRoles.map((inviteRole) => (
                <option key={inviteRole} value={inviteRole}>
                  {toInviteRoleLabel(inviteRole, productSku)}
                </option>
              ))}
            </Select>
            <p className="sr-only" data-testid="invite-role-description">
              {toInviteRoleDescription(role, productSku)}
            </p>
          </FormField>
          {isComplete && staffInvite ? (
            <FormField
              id="invite-scope"
              label="Operational responsibility"
              required
              hint="This teammate operates only the selected part of Complete. It does not change the subscription."
            >
              <Select
                id="invite-scope"
                required
                value={inviteOperatingScope}
                onChange={(event) =>
                  setOperatingScope(event.target.value as MemberOperatingScope | "")
                }
                data-testid="invite-operating-scope"
              >
                <option value="">Choose operational responsibility</option>
                {scopeOptions.map((scope) => (
                  <option key={scope} value={scope}>
                    {toOperatingScopeLabel(scope)}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={
                loading ||
                email.trim().length < 3 ||
                (isComplete && staffInvite && inviteOperatingScope.length === 0)
              }
            >
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
        {error ? <Alert variant="danger">{error}</Alert> : null}
        {notice ? <Alert variant="success">{notice}</Alert> : null}
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
                      {formatRoles(invitation.roles)}
                      {formatScope(invitation.operating_scope, productSku)
                        ? ` · ${formatScope(invitation.operating_scope, productSku)}`
                        : ""}{" "}
                      · {formatInvitationEmailState(invitation.emailStatus ?? invitation.delivery_status)}
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
              {memberships.map((membership) => {
                const role = primaryRole(membership.roles.filter(isUserRole));
                const stored = isMemberOperatingScope(membership.operating_scope)
                  ? membership.operating_scope
                  : null;
                return (
                  <li key={membership.id} className="space-y-1">
                    <p className="text-[var(--mpa-color-text-primary)]">
                      {derivedOperatingPositionLabel({
                        role,
                        scope: stored,
                        sku: productSku
                      })}{" "}
                      <span className="text-[var(--mpa-color-text-secondary)]">
                        ({membership.status})
                      </span>
                    </p>
                    {isComplete ? (
                      <div className="space-y-1">
                        <p className="text-xs">{formatScope(membership.operating_scope, productSku)}</p>
                        <Select
                          aria-label="Operational responsibility"
                          value={stored ?? ""}
                          disabled={loading}
                          onChange={(event) => {
                            const next = event.target.value;
                            if (isMemberOperatingScope(next)) {
                              void updateMembershipScope(membership.id, next);
                            }
                          }}
                        >
                          <option value="" disabled>
                            Assign operational responsibility
                          </option>
                          {MEMBER_OPERATING_SCOPES.map((scope) => (
                            <option key={scope} value={scope}>
                              {toOperatingScopeLabel(scope)}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ) : null}
                    {canUpdateMemberships && membership.status === "active" ? (
                      pendingDeactivateId === membership.id ? (
                        <div className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] p-2">
                          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                            Deactivate this teammate? They lose access. Their membership record stays.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="danger"
                              disabled={loading}
                              onClick={() => void deactivateMembership(membership.id)}
                            >
                              Confirm deactivate
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={loading}
                              onClick={() => setPendingDeactivateId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={loading}
                          onClick={() => setPendingDeactivateId(membership.id)}
                        >
                          Deactivate
                        </Button>
                      )
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
