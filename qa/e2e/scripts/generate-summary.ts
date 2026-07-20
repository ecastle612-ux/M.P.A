/**
 * Generates Markdown summary from Playwright JSON report.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Suite = {
  title: string;
  specs?: Array<{
    title: string;
    ok?: boolean;
    tests?: Array<{
      status?: string;
      results?: Array<{ status?: string; error?: { message?: string } }>;
    }>;
  }>;
  suites?: Suite[];
};

type Report = {
  suites?: Suite[];
  stats?: { expected?: number; unexpected?: number; flaky?: number; duration?: number };
};

const root = path.dirname(fileURLToPath(import.meta.url));
const reportPath = path.join(root, "../reports/results.json");
const outPath = path.join(root, "../reports/summary.md");

type Row = { status: string; title: string; tags: string[] };

function tagsFromTitle(title: string): string[] {
  return [...title.matchAll(/@[\w-]+/g)].map((m) => m[0] ?? "");
}

function walk(suite: Suite, parent: string, rows: Row[]) {
  const suiteTitle = parent ? `${parent} › ${suite.title}` : suite.title;
  for (const spec of suite.specs ?? []) {
    const full = `${suiteTitle} › ${spec.title}`;
    rows.push({
      status: spec.ok === false ? "FAIL" : "PASS",
      title: full,
      tags: tagsFromTitle(full)
    });
  }
  for (const child of suite.suites ?? []) {
    walk(child, suiteTitle, rows);
  }
}

function countByTag(rows: Row[], tag: string) {
  const matched = rows.filter((row) => row.tags.includes(tag));
  return {
    total: matched.length,
    failed: matched.filter((row) => row.status === "FAIL").length,
    passed: matched.filter((row) => row.status === "PASS").length
  };
}

function main() {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  if (!fs.existsSync(reportPath)) {
    fs.writeFileSync(
      outPath,
      `# QA-001 Run Summary\n\nNo results.json found. Run Playwright first.\n`
    );
    console.log(`Wrote ${outPath}`);
    return;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as Report;
  const rows: Row[] = [];
  for (const suite of report.suites ?? []) {
    walk(suite, "", rows);
  }

  const failures = rows.filter((row) => row.status === "FAIL");
  const smoke = countByTag(rows, "@smoke");
  const visual = countByTag(rows, "@visual");
  const a11y = countByTag(rows, "@a11y");
  const perf = countByTag(rows, "@perf");

  const md = `# QA-001 Run Summary

Env: \`${process.env["PLAYWRIGHT_BASE_URL"] ?? "local"}\`  
SHA: \`${process.env["GITHUB_SHA"] ?? "local"}\`  
Trigger: \`${process.env["GITHUB_EVENT_NAME"] ?? "local"}\`  
Auth enabled: \`${process.env["QA_E2E_AUTH_ENABLED"] ?? "false"}\`

| Suite | Passed | Failed | Total |
|-------|--------|--------|-------|
| smoke (@smoke) | ${smoke.passed} | ${smoke.failed} | ${smoke.total} |
| visual (@visual) | ${visual.passed} | ${visual.failed} | ${visual.total} |
| a11y (@a11y) | ${a11y.passed} | ${a11y.failed} | ${a11y.total} |
| perf (@perf) | ${perf.passed} | ${perf.failed} | ${perf.total} |

| Status | Test |
|--------|------|
${rows.map((row) => `| ${row.status} | ${row.title} |`).join("\n") || "| — | No specs parsed |"}

## Failures

${failures.length === 0 ? "- None" : failures.map((row) => `- ${row.title}`).join("\n")}

## Accessibility Report

- Specs tagged \`@a11y\`: ${a11y.total} (failed: ${a11y.failed})
- Gate: critical/serious axe violations fail the suite (see a11y specs)

## Performance Summary

- Specs tagged \`@perf\`: ${perf.total} (failed: ${perf.failed})
- Budgets enforced in \`tests/perf/*\` (login load, optional dashboard timing)

## Visual Diff Report

- Specs tagged \`@visual\`: ${visual.total} (failed: ${visual.failed})
- Baselines: \`tests/**/*-snapshots/\`
- Diff artifacts (on failure): \`test-results/**\`

## Stats

- Expected: ${report.stats?.expected ?? "n/a"}
- Unexpected: ${report.stats?.unexpected ?? "n/a"}
- Flaky: ${report.stats?.flaky ?? "n/a"}
- Duration (ms): ${report.stats?.duration ?? "n/a"}

## Artifacts

- HTML report: \`qa/e2e/playwright-report\`
- Failure screenshots / traces: \`qa/e2e/test-results\`
- Console / network attachments: attached per test when present
- JSON: \`qa/e2e/reports/results.json\`
- Markdown: \`qa/e2e/reports/summary.md\`
`;

  fs.writeFileSync(outPath, md);
  console.log(md);
}

main();
