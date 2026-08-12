import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  parseNotificationPreferences,
  toNotificationPreferencesJson
} from "../profile/contracts";
import { notificationPreferenceSummaryCopy } from "../profile/notification-preferences";
import robots from "../../app/robots";
import sitemap from "../../app/sitemap";

const webRoot = join(process.cwd(), "src");

describe("Wave B3 customer trust (PPS1-007/010/011/013/019/022)", () => {
  it("vendors surface is a directory, not a launchpad-only stub (PPS1-007)", () => {
    const page = readFileSync(join(webRoot, "app/(app)/pm/vendors/page.tsx"), "utf8");
    const directory = readFileSync(
      join(webRoot, "components/commercial/vendors-directory.tsx"),
      "utf8"
    );
    expect(page).toMatch(/VendorsDirectory/);
    expect(directory).toMatch(/Add vendor/);
    expect(directory).toMatch(/\/api\/pm\/maintenance\/vendors/);
    expect(directory).not.toMatch(/Launchpad only/i);
  });

  it("leasing language uses manual screening, not placeholder theater (PPS1-010)", () => {
    const leasing = readFileSync(
      join(webRoot, "components/leasing/leasing-directory.tsx"),
      "utf8"
    );
    expect(leasing).not.toMatch(/screen \(placeholder\)/i);
    expect(leasing).toMatch(/manual screening/i);
  });

  it("notification preferences drop SMS and keep email/in-app (PPS1-011)", () => {
    expect(parseNotificationPreferences({ email: true, in_app: false, sms: true })).toEqual({
      email: true,
      in_app: false,
      sms: false
    });
    const persisted = toNotificationPreferencesJson(DEFAULT_NOTIFICATION_PREFERENCES) as {
      sms?: boolean;
    };
    expect(persisted.sms).toBe(false);
    expect(notificationPreferenceSummaryCopy()).not.toMatch(/SMS delivery is available/i);

    const profile = readFileSync(join(webRoot, "components/profile/profile-form.tsx"), "utf8");
    expect(profile).toMatch(/Email/);
    expect(profile).toMatch(/In-app/);
    expect(profile).toMatch(/SMS delivery\s+is not available/i);
    expect(profile).not.toMatch(/>\s*SMS\s*</);
  });

  it("Modules is Explore Platforms discovery; Get Started remains acquisition (PPS1-013)", () => {
    const chrome = readFileSync(
      join(webRoot, "components/marketing/marketing-chrome.tsx"),
      "utf8"
    );
    const modules = readFileSync(join(webRoot, "components/marketing/modules-page.tsx"), "utf8");
    expect(chrome).toMatch(/Explore Platforms/);
    expect(chrome).toMatch(/Get Started/);
    expect(chrome).toContain('href: "/demo"');
    expect(modules).toMatch(/Explore Platforms/);
    expect(modules).toMatch(/discovery only/i);
    expect(modules).not.toMatch(/Get started · Step 1/i);
  });

  it("notification center hides zero unread badge and uses skeleton loading (PPS1-019)", () => {
    const center = readFileSync(
      join(webRoot, "components/shell/notification-center.tsx"),
      "utf8"
    );
    expect(center).toMatch(/unreadCount > 0/);
    expect(center).toMatch(/Skeleton/);
    expect(center).not.toMatch(/Loading…/);
    expect(center).toMatch(/applyNotificationsPayload/);
    expect(center.match(/const load = useCallback/g)?.length).toBe(1);
  });

  it("robots and sitemap expose public routes only (PPS1-022)", () => {
    const robotsBody = robots();
    const rules = Array.isArray(robotsBody.rules) ? robotsBody.rules[0] : robotsBody.rules;
    expect(rules?.allow).toEqual(
      expect.arrayContaining(["/", "/modules", "/pricing", "/get-started", "/enterprise"])
    );
    expect(rules?.disallow).toEqual(expect.arrayContaining(["/demo", "/admin", "/pm/", "/portal/"]));

    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith("/"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/modules"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/pricing"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/get-started"))).toBe(true);
    expect(urls.some((url) => url.includes("/demo"))).toBe(false);
    expect(urls.some((url) => url.includes("/admin"))).toBe(false);
  });
});

describe("Wave B3 error/empty consistency (PPS1-018)", () => {
  it("shares ErrorRetry and uses it on major FO/PM surfaces", () => {
    const errorRetry = readFileSync(join(webRoot, "components/shell/error-retry.tsx"), "utf8");
    expect(errorRetry).toContain('role="alert"');
    expect(errorRetry).toMatch(/Retry/);

    for (const relative of [
      "components/facility/facility-mission-control-page.tsx",
      "components/facility/facility-operations-workspace.tsx",
      "components/maintenance/maintenance-command-center.tsx",
      "components/property/property-command-center.tsx",
      "components/commercial/vendors-directory.tsx"
    ]) {
      const source = readFileSync(join(webRoot, relative), "utf8");
      expect(source).toMatch(/ErrorRetry/);
    }
  });
});
