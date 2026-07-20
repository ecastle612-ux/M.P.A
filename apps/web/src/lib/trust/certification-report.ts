import { runProviderCertification } from "./provider-certification";
import { runDataIntegrityAudit } from "./data-integrity";
import { buildStaticPerformanceReport } from "./performance";
import type { TrustCertificationReport } from "./contracts";

export async function buildTrustCertificationReport(options?: {
  organizationId?: string | null;
  includeIntegrity?: boolean;
  performanceTimings?: Record<string, number>;
}): Promise<TrustCertificationReport> {
  const providers = await runProviderCertification();
  const integrity =
    options?.includeIntegrity !== false && options?.organizationId
      ? await runDataIntegrityAudit(options.organizationId)
      : null;

  const performance = buildStaticPerformanceReport(options?.performanceTimings);

  const summary = {
    providersPass: providers.filter((p) => p.overall === "pass").length,
    providersWarn: providers.filter((p) => p.overall === "warn").length,
    providersFail: providers.filter((p) => p.overall === "fail").length,
    providersSkipped: providers.filter((p) => p.overall === "skipped" || p.overall === "not_in_path").length,
    integrityErrors: integrity?.errorCount ?? 0
  };

  return {
    generatedAt: new Date().toISOString(),
    providers,
    integrity,
    performance,
    summary
  };
}
