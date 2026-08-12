import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  Alert,
  buttonClassName,
  resolveHealthToneVariant,
  resolvePriorityToneVariant,
  resolveStatusBadgeVariant,
  resolveWorkOrderPriorityVariant
} from "@mpa/ui";

const webRoot = join(process.cwd(), "src");
const repoRoot = join(process.cwd(), "../..");

function read(rel: string): string {
  return readFileSync(join(webRoot, rel), "utf8");
}

describe("Wave C1 Canopy convergence (PPS1-014/015/016/017)", () => {
  it("exports buttonClassName used by PM/FO quick actions (PPS1-014)", () => {
    expect(buttonClassName({ variant: "primary" })).toMatch(/mpa-color-brand-primary/);
    expect(buttonClassName({ variant: "secondary" })).toMatch(/border/);
    expect(read("components/shell/pm-workspace.tsx")).toMatch(/buttonClassName/);
    expect(read("components/shell/fo-workspace.tsx")).toMatch(/buttonClassName/);
    expect(read("components/marketing/marketing-chrome.tsx")).toMatch(/buttonClassName/);
  });

  it("consolidates status badge mapping through @mpa/ui helpers (PPS1-015)", () => {
    expect(resolveStatusBadgeVariant("active")).toBe("success");
    expect(resolveStatusBadgeVariant("pending")).toBe("warning");
    expect(resolveStatusBadgeVariant("overdue")).toBe("danger");
    expect(resolvePriorityToneVariant("critical")).toBe("danger");
    expect(resolveHealthToneVariant("warn")).toBe("warning");
    expect(resolveWorkOrderPriorityVariant("high")).toBe("danger");
    expect(read("components/shell/pm-workspace.tsx")).toMatch(/resolveStatusBadgeVariant/);
    expect(read("components/admin/ops-directory-table.tsx")).toMatch(/resolveStatusBadgeVariant/);
    expect(read("components/admin/ops-directory-table.tsx")).not.toMatch(/function toneVariant/);
  });

  it("ships Alert primitive and migrates high-vis emerald/red boxes (PPS1-016)", () => {
    expect(typeof Alert).toBe("function");
    const alertSrc = readFileSync(join(repoRoot, "packages/ui/src/primitives/alert.tsx"), "utf8");
    expect(alertSrc).toMatch(/variant\?: AlertVariant/);
    expect(read("components/shell/error-retry.tsx")).toMatch(/Alert/);
    expect(read("components/commercial/guided-setup-page.tsx")).toMatch(/Alert variant="danger"/);
    expect(read("components/maintenance/maintenance-command-center.tsx")).toMatch(
      /Alert variant="success"/
    );
    expect(read("components/maintenance/maintenance-command-center.tsx")).not.toMatch(
      /border-emerald-200 bg-emerald-50/
    );
  });

  it("documents remaining token drift without inventing action-primary (PPS1-017)", () => {
    const drift = readFileSync(
      join(repoRoot, "docs/06-design-language/token-drift-wave-c1.md"),
      "utf8"
    );
    expect(drift).toMatch(/Dual token injection/);
    expect(read("app/not-found.tsx")).toMatch(/buttonClassName/);
    expect(read("app/not-found.tsx")).not.toMatch(/--mpa-color-action-primary/);
    expect(read("app/globals.css")).toMatch(/--mpa-color-status-danger-subtle/);
  });
});
