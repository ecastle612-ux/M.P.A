import type {
  NormalizedScreeningReport,
  ScreeningProvider,
  ScreeningOrderInput,
  ScreeningOrderRef,
  ProviderCaseStatus,
  ScreeningWebhookResult
} from "./contracts";

export type { NormalizedScreeningReport } from "../../screening/contracts";

/**
 * Local/CI provider — never calls external networks.
 * Completes with clear component results after consent-gated createOrder.
 */
export const noopScreeningProvider: ScreeningProvider = {
  id: "noop",

  async createOrder(input: ScreeningOrderInput): Promise<ScreeningOrderRef> {
    return {
      externalReference: `noop-${input.caseNumber}-${input.party.id.slice(0, 8)}`,
      externalCandidateId: `noop-cand-${input.party.id.slice(0, 8)}`,
      authorizationUrl: null
    };
  },

  async getStatus(ref: ScreeningOrderRef): Promise<ProviderCaseStatus> {
    return { externalReference: ref.externalReference, status: "completed" };
  },

  async fetchNormalizedReport(ref: ScreeningOrderRef): Promise<NormalizedScreeningReport> {
    const now = new Date().toISOString();
    return {
      externalReference: ref.externalReference,
      status: "completed",
      resultSummary: "No-op screening complete — manual review required.",
      completedAt: now,
      components: [
        { type: "identity", status: "clear", flags: [], summary: "Identity verified (noop)", completedAt: now },
        { type: "credit", status: "clear", flags: [], summary: "Credit clear (noop)", completedAt: now },
        {
          type: "criminal",
          status: "clear",
          flags: [],
          summary: "No criminal records (noop)",
          completedAt: now
        },
        { type: "eviction", status: "clear", flags: [], summary: "No eviction history (noop)", completedAt: now },
        {
          type: "sex_offender",
          status: "clear",
          flags: [],
          summary: "SOR clear (noop)",
          completedAt: now
        }
      ]
    };
  },

  async handleWebhook(payload: unknown): Promise<ScreeningWebhookResult> {
    const body = (payload ?? {}) as Record<string, unknown>;
    const externalEventId =
      typeof body["id"] === "string" ? body["id"] : `noop-wh-${Date.now()}`;
    const externalReference =
      typeof body["externalReference"] === "string"
        ? body["externalReference"]
        : typeof body["external_reference"] === "string"
          ? body["external_reference"]
          : null;

    if (!externalReference) {
      return { externalEventId, screeningExternalReference: null, ignored: true };
    }

    const report = await noopScreeningProvider.fetchNormalizedReport({ externalReference });
    return {
      externalEventId,
      screeningExternalReference: externalReference,
      normalized: report
    };
  }
};
