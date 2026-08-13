import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = join(process.cwd(), "src");

function read(rel: string): string {
  return readFileSync(join(webRoot, rel), "utf8");
}

describe("work surface isolation for Complete Plan", () => {
  it("Property Operations daily ops filters residential work_surface", () => {
    const source = read("lib/property/daily-ops-service.ts");
    expect(source).toMatch(/from\("maintenance_work_orders"\)/);
    expect(source).toMatch(/\.eq\("work_surface", "residential"\)/);
  });

  it("Property Operations owner portfolio filters residential work_surface", () => {
    const source = read("lib/property/owner-portfolio-service.ts");
    expect(source).toMatch(/from\("maintenance_work_orders"\)/);
    expect(source).toMatch(/\.eq\("work_surface", "residential"\)/);
  });

  it("Facility Mission Control snapshot filters facility work_surface", () => {
    const source = read("lib/maintenance/maintenance-service.ts");
    expect(source).toMatch(/getFacilityMissionControlSnapshot/);
    expect(source).toMatch(/\.eq\("work_surface", "facility"\)/);
  });

  it("PM maintenance list API requests residential surface", () => {
    const source = read("app/api/pm/maintenance/route.ts");
    expect(source).toMatch(/listWorkOrders\([\s\S]*surface:\s*"residential"/);
  });
});
