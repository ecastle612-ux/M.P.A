import { describe, expect, it } from "vitest";
import {
  canResendOrEditInvitation,
  canRevokeInvitation,
  invitationActionPath,
  isInvitationExpired,
  normalizeInvitationEmail
} from "./lifecycle";

describe("AUTH-001 invitation lifecycle helpers", () => {
  it("builds resend / revoke / edit-email API paths", () => {
    expect(invitationActionPath("org-123", "invite-456", "resend")).toBe(
      "/api/organizations/org-123/invitations/invite-456/resend"
    );
    expect(invitationActionPath("org-123", "invite-456", "revoke")).toBe(
      "/api/organizations/org-123/invitations/invite-456/revoke"
    );
    expect(invitationActionPath("org-123", "invite-456", "edit-email")).toBe(
      "/api/organizations/org-123/invitations/invite-456/edit-email"
    );
  });

  it("blocks resend/edit on expired or non-pending invitations", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(canResendOrEditInvitation("pending", future)).toBe(true);
    expect(canResendOrEditInvitation("accepted", future)).toBe(false);
    expect(canResendOrEditInvitation("revoked", future)).toBe(false);
    expect(canResendOrEditInvitation("pending", past)).toBe(false);
    expect(isInvitationExpired(past)).toBe(true);
  });

  it("allows revoke on pending invites even when expired", () => {
    expect(canRevokeInvitation("pending")).toBe(true);
    expect(canRevokeInvitation("accepted")).toBe(false);
    expect(canRevokeInvitation("revoked")).toBe(false);
  });

  it("normalizes and validates edit-email input", () => {
    expect(normalizeInvitationEmail("  Ada@Example.COM ")).toBe("ada@example.com");
    expect(normalizeInvitationEmail("not-an-email")).toBeNull();
    expect(normalizeInvitationEmail("")).toBeNull();
  });
});
