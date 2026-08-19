import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "src/components/facility/facility-assignment-rules-page.tsx"), "utf8");

describe("Assignment Rules page — mobile and accessibility contracts", () => {
  it("keeps Phase 1 controls phone-usable and not color-only", () => {
    expect(source).toContain("min-h-11");
    expect(source).toContain("Move up");
    expect(source).toContain("Move down");
    expect(source).toContain("Activate");
    expect(source).toContain("Deactivate");
    expect(source).toContain("Test sample work");
    expect(source).toContain("<span className=\"text-sm font-medium\">");
    expect(source).toContain("Active");
    expect(source).toContain("Inactive");
    expect(source).not.toMatch(/natural.language rule/i);
    expect(source).not.toMatch(/round.?robin/i);
  });
});
