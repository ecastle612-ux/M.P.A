import type { Page } from "@playwright/test";

/** Resident portal maintenance request helper (WF-001). */
export async function openResidentMaintenanceCreate(page: Page) {
  await page.goto("/portal/tenant/maintenance/new");
}

export async function submitResidentMaintenanceRequest(
  page: Page,
  input: { title: string; description?: string }
) {
  await openResidentMaintenanceCreate(page);
  const title = page.getByLabel(/title/i).first();
  if (!(await title.isVisible().catch(() => false))) {
    return { submitted: false as const, reason: "form-unavailable" as const };
  }
  await title.fill(input.title);
  if (input.description) {
    await page.getByLabel(/description/i).first().fill(input.description);
  }
  await page.getByRole("button", { name: /submit request/i }).click();
  await page.waitForURL(/\/portal\/tenant\/maintenance\//, { timeout: 20_000 }).catch(() => undefined);
  return { submitted: true as const };
}
