import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd(), "src/components");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("authenticated sidebar refinement contracts", () => {
  it("uses the shared rail for staff and Master Admin", () => {
    expect(read("shell/sidebar.tsx")).toContain("AppNavRail");
    expect(read("admin/master-admin-shell.tsx")).toContain("AppNavRail");
    expect(read("shell/mobile-nav-drawer.tsx")).toContain("AppNavRail");
    expect(read("shell/app-nav-rail.tsx")).toContain("aria-current={active ? \"page\" : undefined}");
    expect(read("shell/app-nav-rail.tsx")).toContain("motion-reduce:transition-none");
    expect(read("shell/app-nav-rail.tsx")).toContain("min-h-11");
    expect(read("shell/app-nav-rail.tsx")).toContain("MPA_BRAND_TAGLINE");
  });

  it("does not add notification badges or new data fetches on the rail", () => {
    const rail = read("shell/app-nav-rail.tsx");
    const sidebar = read("shell/sidebar.tsx");
    expect(rail).not.toMatch(/badge/i);
    expect(sidebar).not.toMatch(/fetch\(/);
    expect(sidebar).not.toMatch(/My Work —/);
  });

  it("keeps Complete switching as a direct Mission Control hop", () => {
    expect(read("shell/sidebar.tsx")).toContain("completeSurfaceOptions");
    expect(read("shell/sidebar.tsx")).toContain("option.href");
    expect(read("shell/sidebar.tsx")).not.toContain('href="/launcher"');
  });
});
