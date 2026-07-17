import type { ScreeningProvider, ScreeningProviderResult } from "./contracts";

export const noopScreeningProvider: ScreeningProvider = {
  id: "noop",
  async initiateScreening({ caseNumber }): Promise<ScreeningProviderResult> {
    return {
      externalReference: `noop-${caseNumber}`,
      status: "completed",
      resultSummary: "No-op screening provider — manual review required."
    };
  }
};
