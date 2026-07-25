#!/usr/bin/env node
/**
 * Governance guard: product UI must not hardcode logo asset paths.
 * Allowed: branding module, BrandLogo, offline.html (static adaptive), email package helpers, tests/docs.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["apps/web/src", "packages/email/src", "packages/shared/src"];
const HARDCODE = /\/branding\/logo-(light|dark)\.(png|webp)/g;
const ALLOW_PATH_SNIPPETS = [
  "packages/shared/src/branding.ts",
  "packages/shared/src/branding.test.ts",
  "apps/web/src/lib/branding.ts",
  "apps/web/src/lib/integrations/email/render.test.ts",
  "apps/web/src/app/dev/brand-certification/",
  "apps/web/src/components/branding/brand-logo.tsx"
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "dist") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?|mjs|cjs|html)$/.test(name)) out.push(full);
  }
  return out;
}

function isAllowed(file) {
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  return ALLOW_PATH_SNIPPETS.some((snip) => rel.includes(snip));
}

const violations = [];
for (const dir of SCAN_DIRS) {
  const abs = join(ROOT, dir);
  try {
    for (const file of walk(abs)) {
      if (isAllowed(file)) continue;
      const text = readFileSync(file, "utf8");
      const matches = text.match(HARDCODE);
      if (matches?.length) {
        violations.push(`${relative(ROOT, file)}: ${[...new Set(matches)].join(", ")}`);
      }
    }
  } catch {
    // skip missing dirs
  }
}

if (violations.length) {
  console.error("Hardcoded logo paths outside branding system:\n");
  for (const v of violations) console.error(`  - ${v}`);
  console.error("\nUse <BrandLogo /> or logoPathForTone() / resolveBrandAssetUrl().");
  process.exit(1);
}

console.log("Brand logo surface check passed (no hardcoded product logo paths).");
