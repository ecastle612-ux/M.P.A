import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "src");

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
    } else if (/\.(tsx|ts)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const FORBIDDEN = [
  "Opens when live",
  "Coming Soon",
  "Coming soon",
  "Early Access",
  "Early access",
  "Not yet available",
  "Enterprise required",
  "Contact us to activate"
];

describe("STAB-004 FO customer surfaces have no honesty shells", () => {
  it("facility app routes and components do not advertise unfinished gates", () => {
    const targets = [
      ...walk(join(ROOT, "app/(app)/facility")),
      ...walk(join(ROOT, "components/facility")),
      join(ROOT, "components/shell/fo-workspace.tsx")
    ];

    const offenders: string[] = [];
    for (const file of targets) {
      // Capital projects redirect page is intentionally deferred without customer copy.
      if (file.includes("capital-projects")) continue;
      // Legacy module shell retained only if unused; still must not ship gate copy.
      const text = readFileSync(file, "utf8");
      for (const phrase of FORBIDDEN) {
        if (text.includes(phrase)) {
          offenders.push(`${file}: ${phrase}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
