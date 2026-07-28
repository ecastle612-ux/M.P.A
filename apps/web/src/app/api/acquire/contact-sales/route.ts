import { NextResponse } from "next/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";
import { createOrReuseContactSalesLead } from "../../../../lib/commercial/public-lead";
import {
  acquireClientKey,
  checkAcquireRateLimit
} from "../../../../lib/acquire/rate-limit";
import {
  ACQ_FUNNEL_EVENTS,
  emitAcqFunnelEvent,
  portfolioBandFromInput
} from "../../../../lib/acquire/funnel";
import { log } from "../../../../lib/observability/logger";

export async function POST(request: Request) {
  const rate = checkAcquireRateLimit({
    key: acquireClientKey(request, "acq.contact"),
    limit: 10,
    windowMs: 60_000
  });
  if (!rate.allowed) {
    return apiError(429, "RATE_LIMITED", "Too many submissions. Please wait and try again.");
  }

  try {
    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;

    const portfolioSize =
      typeof payload["portfolioSize"] === "string" ? payload["portfolioSize"] : null;

    const result = await createOrReuseContactSalesLead({
      name: String(payload["name"] ?? ""),
      workEmail: String(payload["workEmail"] ?? ""),
      company: String(payload["company"] ?? ""),
      portfolioSize,
      message: typeof payload["message"] === "string" ? payload["message"] : null
    });

    emitAcqFunnelEvent(ACQ_FUNNEL_EVENTS.contactSalesSubmitted, {
      portfolio_band: portfolioBandFromInput(portfolioSize),
      reused: result.reused
    });
    log("info", "acq_contact_sales_submitted", {
      opportunityId: result.opportunity.id,
      reused: result.reused
    });

    return NextResponse.json(
      {
        ok: true,
        reused: result.reused,
        opportunityId: result.opportunity.id
      },
      { status: result.reused ? 200 : 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit contact request";
    if (message.toLowerCase().includes("required")) {
      return apiError(400, "INVALID_INPUT", message);
    }
    log("error", "acq_contact_sales_failed", { message });
    return apiInternalError();
  }
}
