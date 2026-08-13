import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = join(process.cwd(), "src");

describe("Canopy font loading (Vercel Preview safe)", () => {
  it("loads IBM Plex via next/font/local with self-hosted assets", () => {
    const layout = readFileSync(join(webRoot, "app/layout.tsx"), "utf8");
    expect(layout).toMatch(/from ["']next\/font\/local["']/);
    expect(layout).not.toMatch(/next\/font\/google/);
    expect(layout).toMatch(/fonts\/ibm-plex\/IBMPlexSans-Regular\.woff2/);
    expect(layout).toMatch(/fonts\/ibm-plex\/IBMPlexMono-Regular\.woff2/);
  });

  it("keeps CSP font-src self-only (no Google Fonts CDN)", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    expect(config).toMatch(/font-src 'self' data:/);
    expect(config).not.toMatch(/font-src 'self' data: https:/);
  });
});
