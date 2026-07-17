import { describe, expect, it, afterEach } from "vitest";
import {
  DEV_MASTER_ADMIN_EMAIL,
  isDevEnvironment,
  isDevMasterAdminEmail,
  isDevMasterAdminUser,
  shouldBypassSetupWizard
} from "./master-admin";

const originalNodeEnv = process.env["NODE_ENV"];
const originalAppEnv = process.env["APP_ENV"];

afterEach(() => {
  process.env["NODE_ENV"] = originalNodeEnv;
  process.env["APP_ENV"] = originalAppEnv;
});

describe("dev master admin helpers", () => {
  it("detects development environments", () => {
    process.env["NODE_ENV"] = "development";
    process.env["APP_ENV"] = "production";
    expect(isDevEnvironment()).toBe(true);

    process.env["NODE_ENV"] = "production";
    process.env["APP_ENV"] = "local";
    expect(isDevEnvironment()).toBe(true);

    process.env["NODE_ENV"] = "production";
    process.env["APP_ENV"] = "production";
    expect(isDevEnvironment()).toBe(false);
  });

  it("matches the configured master admin email", () => {
    expect(isDevMasterAdminEmail(DEV_MASTER_ADMIN_EMAIL)).toBe(true);
    expect(isDevMasterAdminEmail("  ECastle612@Gmail.com ")).toBe(true);
    expect(isDevMasterAdminEmail("other@example.com")).toBe(false);
  });

  it("only treats users as master admin in dev environments", () => {
    process.env["NODE_ENV"] = "production";
    process.env["APP_ENV"] = "production";

    expect(
      isDevMasterAdminUser({
        email: DEV_MASTER_ADMIN_EMAIL,
        appMetadata: { dev_master_admin: true }
      })
    ).toBe(false);
  });

  it("accepts email or app metadata in development", () => {
    process.env["NODE_ENV"] = "development";
    process.env["APP_ENV"] = "production";

    expect(isDevMasterAdminUser({ email: DEV_MASTER_ADMIN_EMAIL })).toBe(true);
    expect(isDevMasterAdminUser({ email: "other@example.com", appMetadata: { dev_master_admin: true } })).toBe(
      true
    );
    expect(isDevMasterAdminUser({ email: "other@example.com", appMetadata: {} })).toBe(false);
    expect(shouldBypassSetupWizard({ email: DEV_MASTER_ADMIN_EMAIL })).toBe(true);
  });
});
