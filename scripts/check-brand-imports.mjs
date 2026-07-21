#!/usr/bin/env node
/**
 * BR-001 / ADR-021 — Fail the build if logo assets are referenced outside the branding system.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PATTERN = /logo-light\.png|logo-dark\.png|mpa-logo|\/branding\/logo-/;

const SCAN_ROOTS = ["apps", "packages", "scripts", "supabase"];

const ALLOWLIST = [
  "packages/shared/src/branding.ts",
  "apps/web/src/components/branding/brand-logo.tsx",
  "apps/web/src/components/branding/logo.tsx",
  "apps/web/src/lib/branding.ts",
  "apps/web/src/lib/integrations/email/render.ts",
  "apps/web/src/lib/integrations/email/render.test.ts",
  "apps/web/src/app/layout.tsx",
  "apps/web/src/app/global-error.tsx",
  "apps/web/public/offline.html",
  "packages/email/src/index.ts",
  "scripts/check-brand-imports.mjs",
  "apps/web/eslint.config.mjs",
  "apps/web/public/icons/README.md",
  "supabase/templates/",
  "docs/",
  "qa/e2e/"
];

const IGNORE_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".vercel",
  "dist",
  "coverage",
  ".git",
  "playwright-report",
  "test-results"
]);

function isAllowlisted(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  return ALLOWLIST.some((entry) => normalized === entry || normalized.startsWith(entry));
}

function* walk(dirAbs, relBase) {
  let entries;
  try {
    entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (IGNORE_DIR_NAMES.has(entry.name)) continue;
    const abs = path.join(dirAbs, entry.name);
    const rel = path.join(relBase, entry.name).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      yield* walk(abs, rel);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|mjs|cjs|html|css|md|json)$/i.test(entry.name)) continue;
    yield rel;
  }
}

const violations = [];

for (const root of SCAN_ROOTS) {
  const absRoot = path.join(ROOT, root);
  if (!fs.existsSync(absRoot)) continue;
  for (const rel of walk(absRoot, root)) {
    if (isAllowlisted(rel)) continue;
    let content;
    try {
      content = fs.readFileSync(path.join(ROOT, rel), "utf8");
    } catch {
      continue;
    }
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      if (PATTERN.test(line)) {
        violations.push(`${rel}:${index + 1}:${line.trim()}`);
      }
    });
  }
}

// Also scan public offline fallback explicitly.
const publicOffline = "apps/web/public/offline.html";
if (!isAllowlisted(publicOffline) && fs.existsSync(path.join(ROOT, publicOffline))) {
  // allowlisted above
}

if (violations.length === 0) {
  console.log("BR-001 brand import check: PASS.");
  process.exit(0);
}

console.error("BR-001 brand import check: FAIL");
console.error(
  "Brand assets must be rendered via <BrandLogo /> (BR-001 / ADR-021).\nDo not import logo-light.png, logo-dark.png, or mpa-logo.* outside the branding system.\n"
);
for (const line of violations) {
  console.error(`  ${line}`);
}
process.exit(1);
