import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readRepo(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("PLAT-006 Slice C post-auth caller contract", () => {
  it("invitation create and accept delegate homeHref to resolvePostAuthHome", () => {
    const source = readRepo("src/lib/team/invitation-service.ts");
    expect(source).toContain("resolvePostAuthHome");
    expect(source).toContain("resolveInvitationHomeHref");
    expect(source).not.toMatch(/homeHref:\s*defaultHomeForRole/);
    expect(source).not.toContain("defaultHomeForRole");
  });

  it("portal magic-link redirectTo uses resolvePostAuthHome", () => {
    const source = readRepo("src/lib/portal/portal-access-service.ts");
    expect(source).toContain("resolvePostAuthHome");
    expect(source).not.toContain("defaultHomeForRole");
  });

  it("login defers stale staff next through resolveLoginNextPath", () => {
    const source = readRepo("src/components/shell/login-form.tsx");
    expect(source).toContain("resolveLoginNextPath");
    expect(source).toContain("router.replace(resolveLoginNextPath(nextPath))");
  });

  it("dashboard and portal index use resolvePostAuthHome", () => {
    expect(readRepo("src/app/(app)/dashboard/page.tsx")).toContain("resolvePostAuthHome");
    expect(readRepo("src/app/(portals)/portal/page.tsx")).toContain("resolvePostAuthHome");
    expect(readRepo("src/app/(portals)/portal/manager/page.tsx")).toContain("resolvePostAuthHome");
  });

  it("does not change FAC-002 work-order report surface isolation", () => {
    const fac002 = readRepo("src/lib/work-order-reports/service.ts");
    expect(fac002).toContain(".eq(\"work_surface\", surface)");
    expect(fac002).toContain("row.work_surface === surface");
  });
});
