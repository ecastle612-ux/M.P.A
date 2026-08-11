import { afterEach, describe, expect, it } from "vitest";
import { isDemoRuntimeEnabled } from "./demo-runtime";

describe("STAB-015 demo production exposure", () => {
  const originalVercel = process.env["VERCEL_ENV"];
  const originalDemo = process.env["DEMO_ENABLED"];

  afterEach(() => {
    if (originalVercel === undefined) delete process.env["VERCEL_ENV"];
    else process.env["VERCEL_ENV"] = originalVercel;
    if (originalDemo === undefined) delete process.env["DEMO_ENABLED"];
    else process.env["DEMO_ENABLED"] = originalDemo;
  });

  it("allows demo outside Vercel Production", () => {
    delete process.env["VERCEL_ENV"];
    delete process.env["DEMO_ENABLED"];
    expect(isDemoRuntimeEnabled()).toBe(true);
  });

  it("fails closed on Vercel Production without DEMO_ENABLED", () => {
    process.env["VERCEL_ENV"] = "production";
    delete process.env["DEMO_ENABLED"];
    expect(isDemoRuntimeEnabled()).toBe(false);
  });

  it("allows Production only when DEMO_ENABLED=true", () => {
    process.env["VERCEL_ENV"] = "production";
    process.env["DEMO_ENABLED"] = "true";
    expect(isDemoRuntimeEnabled()).toBe(true);
  });
});
