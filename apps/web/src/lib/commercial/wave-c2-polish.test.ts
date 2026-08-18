import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { reduceDismissibleMenu } from "../ui/dismissible-menu";

const webRoot = join(process.cwd(), "src");
const repoRoot = join(process.cwd(), "../..");

function read(rel: string): string {
  return readFileSync(join(webRoot, rel), "utf8");
}

describe("Wave C2 accessibility + trust polish", () => {
  it("notification and profile popovers use dismissible Escape/outside grammar (PPS1-020)", () => {
    const hook = read("lib/ui/use-dismissible-popover.ts");
    expect(hook).toMatch(/Escape/);
    expect(hook).toMatch(/mousedown/);
    expect(hook).toMatch(/focus/);
    expect(read("components/shell/notification-center.tsx")).toMatch(/useDismissiblePopover/);
    expect(read("components/shell/notification-center.tsx")).toMatch(/aria-controls/);
    expect(read("components/shell/account-menu.tsx")).toMatch(/useDismissiblePopover/);
    expect(read("components/shell/account-menu.tsx")).toMatch(/Owner Operations/);
    expect(read("components/shell/profile-menu.tsx")).toMatch(/AccountMenu/);
    expect(reduceDismissibleMenu({ open: true, pathname: "/a" }, { type: "close" }).open).toBe(
      false
    );
  });

  it("profile and finance forms use visible labels with htmlFor (PPS1-021)", () => {
    const profile = read("components/profile/profile-form.tsx");
    expect(profile).toMatch(/htmlFor="profile-display-name"/);
    expect(profile).toMatch(/id="profile-display-name"/);
    expect(profile).not.toMatch(/placeholder="Display name"/);
    const collections = read("components/finance/collections-desk.tsx");
    expect(collections).toMatch(/htmlFor="arrangement-total"/);
    expect(collections).toMatch(/htmlFor="collections-vendor-name"/);
    expect(collections).toMatch(/htmlFor="invoice-number"/);
    const finance = read("components/finance/finance-desk.tsx");
    expect(finance).toMatch(/htmlFor="manual-payment-amount"/);
  });

  it("checkout surfaces avoid customer-facing Stripe jargon (PPS1-023)", () => {
    const cancel = read("components/marketing/checkout-cancel-page.tsx");
    expect(cancel).not.toMatch(/Stripe Checkout/);
    expect(cancel).not.toMatch(/idempotency/i);
    expect(cancel).not.toMatch(/Duplicate\s+subscriptions are prevented automatically/);
    expect(read("components/marketing/checkout-success-page.tsx")).toMatch(
      /Waiting for payment confirmation/
    );
    expect(read("components/marketing/checkout-success-page.tsx")).not.toMatch(
      /Waiting for Stripe confirmation/
    );
    expect(read("components/marketing/commerce-continue-page.tsx")).not.toMatch(/Stripe Checkout/);
  });

  it("lifecycle email copy matches period-end cancel policy (PPS1-024)", () => {
    const emails = read("lib/saas-lifecycle/emails.ts");
    expect(emails).not.toMatch(/Reactivate anytime/i);
    expect(emails).toMatch(/Access continues through the paid period/i);
  });

  it("public Background Screening language stays honest (PPS1-025)", () => {
    const note = read("components/marketing/future-integrations-note.tsx");
    expect(note).toMatch(/BACKGROUND_SCREENING_STATUS = "Integration planned"/);
    expect(note).toMatch(
      /BACKGROUND_SCREENING_LINE = `\$\{BACKGROUND_SCREENING_LABEL\} — \$\{BACKGROUND_SCREENING_STATUS\}`/
    );
    expect(note).not.toMatch(/\(Integration Planned\)/);
  });

  it("operator-facing chrome uses Owner Operations (PPS1-028)", () => {
    expect(read("components/shell/account-menu.tsx")).toMatch(/Owner Operations/);
    expect(read("app/unauthorized/page.tsx")).toMatch(/Owner Operations is available/);
    expect(read("components/reports/reports-workspace.tsx")).toMatch(
      /Owner Operations Command Center/
    );
  });

  it("notification center and command palette apply low-risk request guards (PPS1-029)", () => {
    const nc = read("components/shell/notification-center.tsx");
    expect(nc).toMatch(/NOTIFICATIONS_STALE_MS/);
    expect(nc).toMatch(/lastFetchedAt/);
    const palette = read("components/shell/command-palette.tsx");
    expect(palette).toMatch(/setTimeout/);
    expect(palette).toMatch(/200/);
    expect(palette).toMatch(/if \(!trimmed\)/);
    const notes = readFileSync(
      join(repoRoot, "docs/06-design-language/performance-notes-wave-c2.md"),
      "utf8"
    );
    expect(notes).toMatch(/Documented — leave unchanged/);
  });
});

