import { describe, expect, it } from "vitest";
import {
  conversationPreviewFromBody,
  defaultConversationSubject,
  isConversationUnread,
  isPmCommsStaffRole,
  staffHasTenantCommsEntitlement,
  tenantConversationHref,
  validateConversationMessageContent
} from "./conversations";

describe("COM-002 conversation helpers", () => {
  it("requires body or attachments", () => {
    expect(validateConversationMessageContent({ body: "  " }).ok).toBe(false);
    expect(validateConversationMessageContent({ body: "Hello" }).ok).toBe(true);
    expect(validateConversationMessageContent({ mediaIds: ["m1"] }).ok).toBe(true);
  });

  it("computes unread from cursor and last sender", () => {
    expect(
      isConversationUnread({
        lastMessageAt: "2026-08-14T12:00:00.000Z",
        lastReadAt: null,
        lastSenderUserId: "staff",
        viewerUserId: "tenant"
      })
    ).toBe(true);
    expect(
      isConversationUnread({
        lastMessageAt: "2026-08-14T12:00:00.000Z",
        lastReadAt: "2026-08-14T11:00:00.000Z",
        lastSenderUserId: "tenant",
        viewerUserId: "tenant"
      })
    ).toBe(false);
    expect(
      isConversationUnread({
        lastMessageAt: "2026-08-14T12:00:00.000Z",
        lastReadAt: "2026-08-14T12:00:00.000Z",
        lastSenderUserId: "staff",
        viewerUserId: "tenant"
      })
    ).toBe(false);
  });

  it("builds previews and default subjects", () => {
    expect(conversationPreviewFromBody("")).toBe("Attachment");
    expect(defaultConversationSubject({ linkedEntityType: "work_order", linkedEntityLabel: "Leak" })).toBe(
      "Leak"
    );
    expect(tenantConversationHref("c1")).toBe("/portal/tenant/messages/c1");
  });

  it("requires PM tenant portal entitlement and blocks FO-only", () => {
    expect(staffHasTenantCommsEntitlement(["platform.communications", "pm.portal_tenant"])).toBe(true);
    expect(staffHasTenantCommsEntitlement(["platform.communications", "facility.operations"])).toBe(
      false
    );
  });
});

describe("PLAT-002 comms staff roles", () => {
  it("allows desk roles and denies technicians", () => {
    expect(isPmCommsStaffRole("organization_admin")).toBe(true);
    expect(isPmCommsStaffRole("property_manager")).toBe(true);
    expect(isPmCommsStaffRole("leasing_agent")).toBe(true);
    expect(isPmCommsStaffRole("maintenance_technician")).toBe(false);
    expect(isPmCommsStaffRole("tenant")).toBe(false);
    expect(isPmCommsStaffRole("vendor")).toBe(false);
  });
});

