/**
 * PT-001 provider certification CLI (sandbox / local).
 * Usage: pnpm --filter @mpa/web exec tsx scripts/dev/run-trust-certification.ts
 *
 * Avoid importing auth/server (integrity audit) so this runs without full Next env.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { runProviderCertification } from "../../src/lib/trust/provider-certification";
import { buildStaticPerformanceReport } from "../../src/lib/trust/performance";
import type { TrustCertificationReport } from "../../src/lib/trust/contracts";

async function main() {
  const providers = await runProviderCertification();
  const report: TrustCertificationReport = {
    generatedAt: new Date().toISOString(),
    providers,
    integrity: null,
    performance: buildStaticPerformanceReport(),
    summary: {
      providersPass: providers.filter((p) => p.overall === "pass").length,
      providersWarn: providers.filter((p) => p.overall === "warn").length,
      providersFail: providers.filter((p) => p.overall === "fail").length,
      providersSkipped: providers.filter((p) => p.overall === "skipped" || p.overall === "not_in_path").length,
      integrityErrors: 0
    }
  };

  const outDir = resolve(process.cwd(), "../../docs/58-pt-001-production-trust");
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, "provider-certification-run.json");
  writeFileSync(outFile, JSON.stringify(report, null, 2), "utf8");

  console.log("PT-001 Provider Certification");
  console.log(`Generated: ${report.generatedAt}`);
  console.log(
    `Summary: pass=${report.summary.providersPass} warn=${report.summary.providersWarn} fail=${report.summary.providersFail} skipped=${report.summary.providersSkipped}`
  );
  for (const provider of report.providers) {
    console.log(`- ${provider.provider} [${provider.overall}] mode=${provider.mode}`);
    for (const check of provider.checks) {
      console.log(`    ${check.status.padEnd(12)} ${check.check}: ${check.detail}`);
    }
  }
  console.log(`Wrote ${outFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
