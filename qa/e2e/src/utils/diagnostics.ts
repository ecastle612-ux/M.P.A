import type { Page, TestInfo } from "@playwright/test";

type ConsoleEntry = { type: string; text: string };
type NetworkFailure = { url: string; status: number; method: string };

/**
 * Attaches console errors and failed network responses to the test report.
 */
export function attachDiagnostics(page: Page, testInfo: TestInfo) {
  const consoleEntries: ConsoleEntry[] = [];
  const networkFailures: NetworkFailure[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      consoleEntries.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on("pageerror", (error) => {
    consoleEntries.push({ type: "pageerror", text: error.message });
  });
  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      networkFailures.push({
        url: response.url(),
        status,
        method: response.request().method()
      });
    }
  });

  return {
    async flush() {
      if (consoleEntries.length > 0) {
        await testInfo.attach("console-log.json", {
          body: Buffer.from(JSON.stringify(consoleEntries, null, 2)),
          contentType: "application/json"
        });
      }
      if (networkFailures.length > 0) {
        await testInfo.attach("network-failures.json", {
          body: Buffer.from(JSON.stringify(networkFailures, null, 2)),
          contentType: "application/json"
        });
      }
    }
  };
}
