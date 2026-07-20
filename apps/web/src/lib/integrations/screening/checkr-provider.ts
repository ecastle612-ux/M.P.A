import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  NormalizedScreeningReport,
  NormalizedComponentResult,
  ScreeningComponentType
} from "../../screening/contracts";
import type {
  ScreeningProvider,
  ScreeningOrderInput,
  ScreeningOrderRef,
  ProviderCaseStatus,
  ScreeningWebhookResult,
  ProviderArtifact
} from "./contracts";

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function isSandboxMode(): boolean {
  if (env("CHECKR_MODE") === "sandbox") return true;
  if (env("CHECKR_SANDBOX") === "true") return true;
  const key = env("CHECKR_API_KEY");
  return !key || key.startsWith("test_") || key.startsWith("sandbox_");
}

function checkrBaseUrl(): string {
  return env("CHECKR_API_BASE_URL") ?? "https://api.checkr.com";
}

async function checkrFetch(path: string, init?: RequestInit): Promise<Response> {
  const apiKey = env("CHECKR_API_KEY");
  if (!apiKey) {
    throw new Error("CHECKR_API_KEY is not configured");
  }
  const auth = Buffer.from(`${apiKey}:`).toString("base64");
  return fetch(`${checkrBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {})
    }
  });
}

function mapComponentStatus(raw: unknown): NormalizedComponentResult["status"] {
  const value = String(raw ?? "").toLowerCase();
  if (["clear", "complete", "completed"].includes(value)) return "clear";
  if (["consider", "review", "dispute"].includes(value)) return "review";
  if (["fail", "failed", "canceled", "cancelled"].includes(value)) return "fail";
  if (["pending", "pending_invitation", "in_progress"].includes(value)) return "pending";
  return "review";
}

function sandboxReport(ref: ScreeningOrderRef, components: ScreeningComponentType[]): NormalizedScreeningReport {
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  return {
    externalReference: ref.externalReference,
    status: "completed",
    resultSummary: "Checkr sandbox report ready for manual review.",
    completedAt: now,
    expiresAt: expires,
    components: components.map((type) => ({
      type,
      status: type === "income" ? ("not_requested" as const) : ("clear" as const),
      flags:
        type === "credit"
          ? [{ code: "SANDBOX", severity: "info" as const, message: "Sandbox credit result" }]
          : [],
      summary: `${type} complete (Checkr sandbox)`,
      providerReference: `${ref.externalReference}:${type}`,
      completedAt: now
    })),
    rawArtifactHints: [{ name: "sandbox-report.pdf", contentType: "application/pdf" }]
  };
}

/**
 * Checkr adapter (Q1 primary provider).
 * Sandbox mode works without live network when CHECKR_MODE=sandbox or no production key.
 */
export const checkrScreeningProvider: ScreeningProvider = {
  id: "checkr",

  async createOrder(input: ScreeningOrderInput): Promise<ScreeningOrderRef> {
    if (isSandboxMode() && !env("CHECKR_API_KEY")) {
      return {
        externalReference: `checkr-sandbox-${input.caseNumber}`,
        externalCandidateId: `cand-sandbox-${input.party.id.slice(0, 8)}`,
        authorizationUrl: null
      };
    }

    if (isSandboxMode() && env("CHECKR_API_KEY")) {
      // Use Checkr test credentials against API when present
      try {
        const candidateRes = await checkrFetch("/v1/candidates", {
          method: "POST",
          body: JSON.stringify({
            email: input.party.email,
            first_name: input.party.fullName.split(" ")[0] ?? input.party.fullName,
            last_name: input.party.fullName.split(" ").slice(1).join(" ") || "Applicant",
            custom_id: input.party.id
          })
        });
        if (!candidateRes.ok) {
          const text = await candidateRes.text();
          throw new Error(`Checkr candidate create failed: ${candidateRes.status} ${text}`);
        }
        const candidate = (await candidateRes.json()) as { id: string };
        const invitationRes = await checkrFetch("/v1/invitations", {
          method: "POST",
          body: JSON.stringify({
            candidate_id: candidate.id,
            package: env("CHECKR_PACKAGE") ?? "tasker_pro",
            work_locations: [{ country: "US" }]
          })
        });
        if (!invitationRes.ok) {
          const text = await invitationRes.text();
          throw new Error(`Checkr invitation failed: ${invitationRes.status} ${text}`);
        }
        const invitation = (await invitationRes.json()) as { id: string; invitation_url?: string };
        return {
          externalReference: invitation.id,
          externalCandidateId: candidate.id,
          authorizationUrl: invitation.invitation_url ?? null
        };
      } catch (error) {
        // Fall back to local sandbox simulation so CI/dev still works
        if (env("CHECKR_REQUIRE_LIVE") === "true") throw error;
        return {
          externalReference: `checkr-sandbox-${input.caseNumber}`,
          externalCandidateId: `cand-sandbox-${input.party.id.slice(0, 8)}`,
          authorizationUrl: null
        };
      }
    }

    const candidateRes = await checkrFetch("/v1/candidates", {
      method: "POST",
      body: JSON.stringify({
        email: input.party.email,
        first_name: input.party.fullName.split(" ")[0] ?? input.party.fullName,
        last_name: input.party.fullName.split(" ").slice(1).join(" ") || "Applicant",
        custom_id: input.party.id
      })
    });
    if (!candidateRes.ok) {
      throw new Error(`Checkr candidate create failed: ${candidateRes.status}`);
    }
    const candidate = (await candidateRes.json()) as { id: string };
    const reportRes = await checkrFetch("/v1/reports", {
      method: "POST",
      body: JSON.stringify({
        candidate_id: candidate.id,
        package: env("CHECKR_PACKAGE") ?? "tasker_pro"
      })
    });
    if (!reportRes.ok) {
      throw new Error(`Checkr report create failed: ${reportRes.status}`);
    }
    const report = (await reportRes.json()) as { id: string };
    return {
      externalReference: report.id,
      externalCandidateId: candidate.id,
      authorizationUrl: null
    };
  },

  async getStatus(ref: ScreeningOrderRef): Promise<ProviderCaseStatus> {
    if (ref.externalReference.startsWith("checkr-sandbox-")) {
      return { externalReference: ref.externalReference, status: "completed" };
    }
    const res = await checkrFetch(`/v1/reports/${ref.externalReference}`);
    if (!res.ok) {
      return { externalReference: ref.externalReference, status: "failed", message: `HTTP ${res.status}` };
    }
    const body = (await res.json()) as { status?: string };
    const status = mapComponentStatus(body.status);
    return {
      externalReference: ref.externalReference,
      status: status === "clear" ? "completed" : status === "pending" ? "in_progress" : "failed"
    };
  },

  async fetchNormalizedReport(ref: ScreeningOrderRef): Promise<NormalizedScreeningReport> {
    if (ref.externalReference.startsWith("checkr-sandbox-")) {
      return sandboxReport(ref, ["identity", "credit", "criminal", "eviction", "sex_offender"]);
    }
    const res = await checkrFetch(`/v1/reports/${ref.externalReference}`);
    if (!res.ok) {
      throw new Error(`Checkr report fetch failed: ${res.status}`);
    }
    const body = (await res.json()) as Record<string, unknown>;
    const now = new Date().toISOString();
    const components: NormalizedComponentResult[] = [
      {
        type: "identity",
        status: mapComponentStatus(body["status"]),
        flags: [],
        summary: "Identity / SSN trace",
        providerReference: ref.externalReference,
        completedAt: now
      },
      {
        type: "credit",
        status: mapComponentStatus(body["credit_report_status"] ?? body["status"]),
        flags: [],
        summary: "Credit report",
        completedAt: now
      },
      {
        type: "criminal",
        status: mapComponentStatus(body["criminal_status"] ?? body["status"]),
        flags: [],
        summary: "Criminal search",
        completedAt: now
      },
      {
        type: "eviction",
        status: mapComponentStatus(body["eviction_status"] ?? body["status"]),
        flags: [],
        summary: "Eviction history",
        completedAt: now
      },
      {
        type: "sex_offender",
        status: mapComponentStatus(body["sex_offender_status"] ?? body["status"]),
        flags: [],
        summary: "Sex offender registry",
        completedAt: now
      }
    ];
    return {
      externalReference: ref.externalReference,
      status: body["status"] === "complete" ? "completed" : "in_progress",
      resultSummary: `Checkr report ${ref.externalReference}`,
      completedAt: typeof body["completed_at"] === "string" ? body["completed_at"] : now,
      components
    };
  },

  async listArtifacts(ref: ScreeningOrderRef): Promise<ProviderArtifact[]> {
    if (ref.externalReference.startsWith("checkr-sandbox-")) {
      return [{ name: "sandbox-report.pdf", contentType: "application/pdf" }];
    }
    return [];
  },

  async handleWebhook(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<ScreeningWebhookResult> {
    const secret = env("CHECKR_WEBHOOK_SECRET");
    if (secret) {
      const signature = headers["x-checkr-signature"] ?? headers["X-Checkr-Signature"] ?? "";
      const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
      const digest = createHmac("sha256", secret).update(raw).digest("hex");
      const a = Buffer.from(digest);
      const b = Buffer.from(signature);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new Error("Invalid Checkr webhook signature");
      }
    }

    const body = (payload ?? {}) as Record<string, unknown>;
    const data = (body["data"] ?? body) as Record<string, unknown>;
    const externalEventId =
      typeof body["id"] === "string"
        ? body["id"]
        : typeof data["id"] === "string"
          ? data["id"]
          : `checkr-${Date.now()}`;
    const objectId =
      typeof data["object"] === "object" && data["object"] && typeof (data["object"] as { id?: string }).id === "string"
        ? (data["object"] as { id: string }).id
        : typeof data["id"] === "string"
          ? data["id"]
          : typeof body["externalReference"] === "string"
            ? body["externalReference"]
            : null;

    if (!objectId) {
      return { externalEventId, screeningExternalReference: null, ignored: true };
    }

    const type = String(body["type"] ?? "");
    if (type && !type.includes("report") && !type.includes("invitation") && !type.includes("sandbox")) {
      return { externalEventId, screeningExternalReference: objectId, ignored: true, message: type };
    }

    const report = await checkrScreeningProvider.fetchNormalizedReport({ externalReference: objectId });
    return {
      externalEventId,
      screeningExternalReference: objectId,
      normalized: report
    };
  }
};
