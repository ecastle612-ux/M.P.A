import { describe, expect, it } from "vitest";
import {
  evaluateDeliveryChannels,
  isWithinQuietHours,
  parseQuietHours
} from "./preferences";
import { buildIdempotencyKey, normalizeNotificationCategory } from "./contracts";
import { getNotificationProvider, getNotificationProviderKey } from "../integrations/notifications/registry";

describe("notification categories", () => {
  it("normalizes legacy categories", () => {
    expect(normalizeNotificationCategory("message")).toBe("messages");
    expect(normalizeNotificationCategory("ai")).toBe("ai_operations");
    expect(normalizeNotificationCategory("maintenance")).toBe("maintenance");
  });
});

describe("idempotency", () => {
  it("builds stable keys", () => {
    expect(buildIdempotencyKey("org", "event:1", "user")).toBe("org:event:1:user");
  });
});

describe("quiet hours", () => {
  it("detects overnight quiet window", () => {
    const quiet = parseQuietHours({
      enabled: true,
      startLocal: "22:00",
      endLocal: "07:00",
      timezone: "UTC"
    });
    expect(isWithinQuietHours(quiet, new Date("2026-07-17T23:30:00Z"))).toBe(true);
    expect(isWithinQuietHours(quiet, new Date("2026-07-17T12:00:00Z"))).toBe(false);
  });
});

describe("evaluateDeliveryChannels", () => {
  it("skips push during quiet hours for normal priority", () => {
    const decision = evaluateDeliveryChannels({
      preferences: {
        inAppEnabled: true,
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        emergencyOverride: true,
        categoryPreferences: {},
        quietHours: { enabled: true, startLocal: "00:00", endLocal: "23:59", timezone: "UTC" },
        propertyPreferences: []
      },
      category: "messages",
      priority: "normal"
    });
    expect(decision.inApp).toBe(true);
    expect(decision.push).toBe(false);
    expect(decision.email).toBe(true);
    expect(decision.reasons).toContain("quiet_hours");
  });

  it("overrides quiet hours for emergency", () => {
    const decision = evaluateDeliveryChannels({
      preferences: {
        inAppEnabled: true,
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        emergencyOverride: true,
        categoryPreferences: { emergency: false },
        quietHours: { enabled: true, startLocal: "00:00", endLocal: "23:59", timezone: "UTC" },
        propertyPreferences: []
      },
      category: "emergency",
      priority: "emergency"
    });
    expect(decision.push).toBe(true);
    expect(decision.reasons).toContain("emergency_override");
  });

  it("defaults push off without preferences", () => {
    const decision = evaluateDeliveryChannels({
      preferences: null,
      category: "maintenance",
      priority: "normal"
    });
    expect(decision.inApp).toBe(true);
    expect(decision.push).toBe(false);
  });
});

describe("notification provider registry", () => {
  it("defaults to noop", async () => {
    const previous = process.env["NOTIFICATION_PROVIDER"];
    delete process.env["NOTIFICATION_PROVIDER"];
    try {
      expect(getNotificationProviderKey()).toBe("noop");
      const provider = getNotificationProvider();
      expect(provider.key).toBe("noop");
      const result = await provider.send({
        organizationId: "org",
        notificationId: "n1",
        idempotencyKey: "k",
        userId: "u1",
        externalSubscriptionIds: ["sub"],
        title: "t",
        body: "b",
        category: "system",
        priority: "normal"
      });
      expect(result.status).toBe("skipped");
    } finally {
      if (previous === undefined) delete process.env["NOTIFICATION_PROVIDER"];
      else process.env["NOTIFICATION_PROVIDER"] = previous;
    }
  });
});
