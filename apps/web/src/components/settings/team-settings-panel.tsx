"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Checkbox, Input, Select } from "@mpa/ui";
import { isPropertyScopedRole, isUserRole, type UserRole } from "@mpa/shared";
import { useOrganizationContext } from "../shell/organization-context";
import {
  ROLE_PERMISSION_SUMMARIES,
  STAFF_INVITE_ROLES,
  formatRoleLabel
} from "../../lib/organization/role-summaries";
import {
  canResendOrEditInvitation,
  canRevokeInvitation,
  invitationActionPath,
  isInvitationExpired,
  normalizeInvitationEmail
} from "../../lib/auth/invitations/lifecycle";
import { RecoveryContactPanel } from "./recovery-contact-panel";

export type TeamPendingInvitation = {
  id: string;
  email: string;
  roles: string[];
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  property_ids?: string[];
};

export type TeamMembership = {
  id: string;
  user_id: string;
  roles: string[];
  status: "active" | "inactive";
  display_name?: string | null;
  contact_email?: string | null;
  property_ids?: string[];
};

export type TeamPropertyOption = {
  id: string;
  name: string;
};

function PropertyScopePicker({
  properties,
  selectedIds,
  disabled,
  onChange,
  emptyMessage
}: {
  properties: TeamPropertyOption[];
  selectedIds: string[];
  disabled?: boolean;
  onChange: (next: string[]) => void;
  emptyMessage: string;
}) {
  if (properties.length === 0) {
    return <p className="text-sm text-[var(--mpa-color-text-secondary)]">{emptyMessage}</p>;
  }

  return (
    <fieldset className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] p-3">
      <legend className="px-1 text-xs font-medium text-[var(--mpa-color-text-secondary)]">
        Assigned properties
      </legend>
      <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
        {properties.map((property) => {
          const checked = selectedIds.includes(property.id);
          return (
            <Checkbox
              key={property.id}
              id={`property-scope-${property.id}`}
              label={property.name}
              checked={checked}
              disabled={disabled}
              onChange={() => {
                if (checked) {
                  onChange(selectedIds.filter((id) => id !== property.id));
                } else {
                  onChange([...selectedIds, property.id]);
                }
              }}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

export function TeamSettingsPanel({
  initialInvitations,
  initialMemberships,
  initialProperties,
  canUpdate
}: {
  initialInvitations: TeamPendingInvitation[];
  initialMemberships: TeamMembership[];
  initialProperties: TeamPropertyOption[];
  canUpdate: boolean;
}) {
  const { activeOrganization } = useOrganizationContext();
  const [invitations, setInvitations] = useState(
    initialInvitations.filter((item) => item.status === "pending")
  );
  const [memberships, setMemberships] = useState(initialMemberships);
  const [properties] = useState(initialProperties);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("property_manager");
  const [invitePropertyIds, setInvitePropertyIds] = useState<string[]>([]);
  const [memberDrafts, setMemberDrafts] = useState<Record<string, { role: UserRole; propertyIds: string[] }>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [busyInvitationId, setBusyInvitationId] = useState<string | null>(null);
  const [editingInvitationId, setEditingInvitationId] = useState<string | null>(null);
  const [editEmailValue, setEditEmailValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inviteRequiresScope = isPropertyScopedRole(inviteRole);

  function memberDraft(membership: TeamMembership) {
    const existing = memberDrafts[membership.id];
    if (existing) return existing;
    const role = (membership.roles[0] ?? "property_manager") as UserRole;
    return {
      role: isUserRole(role) ? role : ("property_manager" as UserRole),
      propertyIds: membership.property_ids ?? []
    };
  }

  function setMemberDraft(membershipId: string, next: { role: UserRole; propertyIds: string[] }) {
    setMemberDrafts((prev) => ({ ...prev, [membershipId]: next }));
  }

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
      setMemberDrafts({});
    }
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeOrganization || !isUserRole(inviteRole)) return;
    if (inviteRequiresScope && invitePropertyIds.length === 0) {
      setError("Select at least one property for leasing agents and facility technicians.");
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);

    const response = await fetch(`/api/organizations/${activeOrganization.id}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        roles: [inviteRole],
        ...(inviteRequiresScope ? { propertyIds: invitePropertyIds } : {})
      })
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Invitation failed");
      return;
    }

    setInviteEmail("");
    setInvitePropertyIds([]);
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

  async function saveMembershipRoles(membership: TeamMembership) {
    if (!activeOrganization || !canUpdate) return;
    const draft = memberDraft(membership);
    if (!isUserRole(draft.role)) return;
    if (isPropertyScopedRole(draft.role) && draft.propertyIds.length === 0) {
      setError("Select at least one property for leasing agents and facility technicians.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);

    const response = await fetch(
      `/api/organizations/${activeOrganization.id}/memberships/${membership.user_id}/roles`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roles: [draft.role],
          ...(isPropertyScopedRole(draft.role) ? { propertyIds: draft.propertyIds } : { propertyIds: [] })
        })
      }
    );
    const payload = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to update roles");
      return;
    }

    await refresh();
    setNotice("Roles and property assignments updated.");
  }

  async function resetMemberPassword(userId: string) {
    if (!activeOrganization || !canUpdate) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    const response = await fetch(
      `/api/organizations/${activeOrganization.id}/memberships/${userId}/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "org_admin_team_settings_reset" })
      }
    );
    const payload = (await response.json()) as { message?: string; error?: string; deliveryStatus?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Unable to reset credentials");
      return;
    }

    setNotice(
      payload.deliveryStatus === "sent"
        ? "Temporary credentials emailed to the member."
        : "Reset issued, but email delivery failed. Retry or contact support."
    );
  }

  async function offboardMember(userId: string) {
    if (!activeOrganization || !canUpdate) return;
    setLoading(true);
    setError(null);
    setNotice(null);

    const response = await fetch(
      `/api/organizations/${activeOrganization.id}/memberships/${userId}/offboard`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "org_admin_team_offboard", archive: true })
      }
    );
    const payload = (await response.json()) as { message?: string; error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Unable to offboard member");
      return;
    }

    await refresh();
    setNotice("Member offboarded. History and audit records retained.");
  }

  async function resendInvitation(invitationId: string) {
    if (!activeOrganization || !canUpdate) return;
    setBusyInvitationId(invitationId);
    setError(null);
    setNotice(null);

    const response = await fetch(
      invitationActionPath(activeOrganization.id, invitationId, "resend"),
      { method: "POST" }
    );
    const payload = (await response.json()) as { error?: string };
    setBusyInvitationId(null);

    if (!response.ok) {
      setError(payload.error ?? "Unable to resend invitation");
      return;
    }

    await refresh();
    setNotice("Invitation resent with updated credentials.");
  }

  async function revokeInvitation(invitationId: string) {
    if (!activeOrganization || !canUpdate) return;
    const confirmed = window.confirm(
      "Revoke this invitation? The invite link will stop working immediately."
    );
    if (!confirmed) return;

    setBusyInvitationId(invitationId);
    setError(null);
    setNotice(null);

    const response = await fetch(
      invitationActionPath(activeOrganization.id, invitationId, "revoke"),
      { method: "POST" }
    );
    const payload = (await response.json()) as { error?: string };
    setBusyInvitationId(null);

    if (!response.ok) {
      setError(payload.error ?? "Unable to revoke invitation");
      return;
    }

    if (editingInvitationId === invitationId) {
      setEditingInvitationId(null);
      setEditEmailValue("");
    }
    await refresh();
    setNotice("Invitation revoked.");
  }

  async function saveInvitationEmail(invitationId: string) {
    if (!activeOrganization || !canUpdate) return;
    const email = normalizeInvitationEmail(editEmailValue);
    if (!email) {
      setError("Enter a valid email address before saving.");
      return;
    }

    setBusyInvitationId(invitationId);
    setError(null);
    setNotice(null);

    const response = await fetch(
      invitationActionPath(activeOrganization.id, invitationId, "edit-email"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      }
    );
    const payload = (await response.json()) as { error?: string };
    setBusyInvitationId(null);

    if (!response.ok) {
      setError(payload.error ?? "Unable to update invitation email");
      return;
    }

    setEditingInvitationId(null);
    setEditEmailValue("");
    await refresh();
    setNotice("Invitation email updated and credentials resent.");
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
          <form className="space-y-3" onSubmit={(event) => void handleInvite(event)}>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
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
                  if (!isUserRole(event.target.value)) return;
                  setInviteRole(event.target.value);
                  if (!isPropertyScopedRole(event.target.value)) {
                    setInvitePropertyIds([]);
                  }
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
              <Button
                type="submit"
                disabled={
                  !canUpdate ||
                  loading ||
                  (inviteRequiresScope && (invitePropertyIds.length === 0 || properties.length === 0))
                }
              >
                Invite
              </Button>
            </div>
            {inviteRequiresScope ? (
              <PropertyScopePicker
                properties={properties}
                selectedIds={invitePropertyIds}
                disabled={!canUpdate || loading}
                onChange={setInvitePropertyIds}
                emptyMessage="Create a property before inviting leasing agents or facility technicians."
              />
            ) : null}
          </form>
          {!canUpdate ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              You can view the team. Inviting or deactivating members requires manager permissions.
            </p>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-semibold">Pending invitations</h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Resend credentials, fix a mistyped email, or revoke an invite before it is accepted.
          </p>
          {invitations.length === 0 ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">No pending invitations.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {invitations.map((invitation) => {
                const invitationBusy = busyInvitationId === invitation.id || loading;
                const isEditing = editingInvitationId === invitation.id;
                const expired = isInvitationExpired(invitation.expires_at);
                const canResendOrEdit =
                  canUpdate && canResendOrEditInvitation(invitation.status, invitation.expires_at);
                const canRevoke = canUpdate && canRevokeInvitation(invitation.status);
                return (
                  <li
                    key={invitation.id}
                    className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-3"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-[var(--mpa-color-text-secondary)]">
                          Correct email
                          <Input
                            type="email"
                            className="mt-1"
                            value={editEmailValue}
                            onChange={(event) => setEditEmailValue(event.target.value)}
                            disabled={invitationBusy}
                            aria-label={`Edit email for ${invitation.email}`}
                            autoComplete="off"
                          />
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            disabled={invitationBusy}
                            onClick={() => void saveInvitationEmail(invitation.id)}
                          >
                            Save & resend
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={invitationBusy}
                            onClick={() => {
                              setEditingInvitationId(null);
                              setEditEmailValue("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-[var(--mpa-color-text-primary)]">
                          {invitation.email}
                        </p>
                        <p className="text-[var(--mpa-color-text-secondary)]">
                          {invitation.roles.map(formatRoleLabel).join(", ")} · expires{" "}
                          {new Date(invitation.expires_at).toLocaleDateString()}
                          {expired ? " · expired" : ""}
                        </p>
                        {canResendOrEdit || canRevoke ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {canResendOrEdit ? (
                              <>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={invitationBusy}
                                  onClick={() => void resendInvitation(invitation.id)}
                                >
                                  Resend
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  disabled={invitationBusy}
                                  onClick={() => {
                                    setEditingInvitationId(invitation.id);
                                    setEditEmailValue(invitation.email);
                                    setError(null);
                                  }}
                                >
                                  Edit email
                                </Button>
                              </>
                            ) : null}
                            {canRevoke ? (
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={invitationBusy}
                                onClick={() => void revokeInvitation(invitation.id)}
                              >
                                Revoke
                              </Button>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <RecoveryContactPanel canUpdate={canUpdate} />

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
              const draft = memberDraft(membership);
              const scoped = isPropertyScopedRole(draft.role);
              const scopeLabel =
                (membership.property_ids?.length ?? 0) > 0
                  ? `${membership.property_ids!.length} propert${membership.property_ids!.length === 1 ? "y" : "ies"}`
                  : scoped
                    ? "no properties assigned"
                    : null;
              return (
                <li
                  key={membership.id}
                  className="flex flex-col gap-3 py-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{label}</p>
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        {membership.roles.map(formatRoleLabel).join(", ")} · {membership.status}
                        {scopeLabel ? ` · ${scopeLabel}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {canUpdate ? (
                        <Select
                          aria-label={`Role for ${label}`}
                          value={draft.role}
                          disabled={loading}
                          onChange={(event) => {
                            if (!isUserRole(event.target.value)) return;
                            const nextRole = event.target.value;
                            setMemberDraft(membership.id, {
                              role: nextRole,
                              propertyIds: isPropertyScopedRole(nextRole) ? draft.propertyIds : []
                            });
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
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={loading}
                          onClick={() => void saveMembershipRoles(membership)}
                        >
                          Save role
                        </Button>
                      ) : null}
                      {canUpdate && membership.status === "active" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={loading}
                          onClick={() => void resetMemberPassword(membership.user_id)}
                        >
                          Reset password
                        </Button>
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
                      {canUpdate && membership.status === "active" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={loading}
                          onClick={() => void offboardMember(membership.user_id)}
                        >
                          Offboard
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {canUpdate && scoped ? (
                    <PropertyScopePicker
                      properties={properties}
                      selectedIds={draft.propertyIds}
                      disabled={loading}
                      onChange={(propertyIds) =>
                        setMemberDraft(membership.id, { role: draft.role, propertyIds })
                      }
                      emptyMessage="Create a property before assigning leasing agents or facility technicians."
                    />
                  ) : null}
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
