import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isDemoRuntimeEnabled } from "./demo-runtime";

/**
 * Guard: Live Demo must never dump visitors into /modules (catalog/pricing).
 * Source-level check keeps the conversion path honest when runtime is off.
 */
describe("Live Demo entry isolation from modules catalog", () => {
  const originalVercel = process.env["VERCEL_ENV"];
  const originalDemo = process.env["DEMO_ENABLED"];

  afterEach(() => {
    if (originalVercel === undefined) delete process.env["VERCEL_ENV"];
    else process.env["VERCEL_ENV"] = originalVercel;
    if (originalDemo === undefined) delete process.env["DEMO_ENABLED"];
    else process.env["DEMO_ENABLED"] = originalDemo;
  });

  it("keeps demo index renderable when Production runtime is off", () => {
    process.env["VERCEL_ENV"] = "production";
    delete process.env["DEMO_ENABLED"];
    expect(isDemoRuntimeEnabled()).toBe(false);
  });

  it("does not hard-redirect demo pages to /modules in source", () => {
    const roots = [
      join(process.cwd(), "src/app/(demo)/demo/page.tsx"),
      join(process.cwd(), "src/app/(demo)/demo/[product]/page.tsx"),
      join(process.cwd(), "src/app/(demo)/demo/[product]/[surface]/page.tsx"),
      join(process.cwd(), "src/app/api/demo/start/route.ts")
    ];
    for (const file of roots) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/redirect\(\s*["']\/modules["']\s*\)/);
      expect(source).not.toMatch(/new URL\(\s*["']\/modules["']/);
    }
  });
});
