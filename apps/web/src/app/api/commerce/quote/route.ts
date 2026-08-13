import { NextResponse } from "next/server";
import {
  assertQuoteMatchesRecompute,
  buildCommercialQuote,
  createAcquisitionSnapshot,
  createCommerceEvent,
  findForbiddenClientQuoteFields,
  isCommercialQuoteExpired,
  regenerateCommercialQuote,
  validateAcquisitionAnswers,
  type CommercialQuote
} from "@mpa/shared";
import { applyAcquisitionQuoteCookies } from "../../../../lib/commerce/acquisition-durable-state";
import { acquisitionStateTokenFromRequest } from "../../../../lib/commerce/acquisition-quote-cookie";
import {
  getAcquisitionByQuoteId,
  rememberAcquisitionRecord
} from "../../../../lib/commerce/acquisition-session-store";

export const runtime = "nodejs";

/**
 * Server-authoritative commercial quote (Slice 2).
 * Does not create Stripe Prices, Checkout Sessions, or subscriptions.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const forbidden = findForbiddenClientQuoteFields(body);
  if (forbidden.length > 0) {
    createCommerceEvent("commerce.audit.quote_rejected_tamper");
    return NextResponse.json(
      {
        error: "client_authoritative_fields_forbidden",
        fields: forbidden,
        message: "Price, trial, capacity blocks, and Stripe Price IDs are calculated server-side only."
      },
      { status: 400 }
    );
  }

  const validated = validateAcquisitionAnswers({
    managedUnits: body["managedUnits"] ?? body["managed_units"],
    operationalNeed: body["operationalNeed"] ?? body["operational_need"],
    billingInterval: body["billingInterval"] ?? body["billing_interval"],
    notes: body["notes"],
    unitRangeId: body["unitRangeId"] ?? body["unit_range_id"],
    selectedModule: body["selectedModule"] ?? body["selected_module"]
  });
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.reason, field: validated.field },
      { status: 400 }
    );
  }

  const regenerateFromRaw = body["regenerateFromQuoteId"] ?? body["quote_id"];
  const regenerateFrom = typeof regenerateFromRaw === "string" ? regenerateFromRaw : null;

  let quote: CommercialQuote;
  if (regenerateFrom && body["regenerate"] === true) {
    quote = regenerateCommercialQuote({ answers: validated.answers });
  } else {
    quote = buildCommercialQuote({ answers: validated.answers });
  }

  if (!assertQuoteMatchesRecompute(quote)) {
    return NextResponse.json({ error: "quote_integrity_failed" }, { status: 500 });
  }

  const snapshot = createAcquisitionSnapshot(quote);
  const record = await rememberAcquisitionRecord({
    quote,
    snapshot,
    answers: validated.answers
  });

  createCommerceEvent("commerce.audit.quote_created", {
    productSku: quote.module,
    billingCycle: quote.billing_interval,
    offerId: quote.quote_id
  });
  createCommerceEvent("commerce.audit.acquisition_snapshot_created", {
    productSku: quote.module,
    offerId: snapshot.snapshot_id
  });

  const response = NextResponse.json({
    quote,
    snapshot,
    confirmPlanPath: `/checkout?intent=${encodeURIComponent(quote.module)}&cycle=${encodeURIComponent(quote.billing_interval)}&quote=${encodeURIComponent(quote.quote_id)}&snapshot=${encodeURIComponent(snapshot.snapshot_id)}`
  });
  applyAcquisitionQuoteCookies(response, record);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const quoteId = url.searchParams.get("id") ?? url.searchParams.get("quote");
  if (!quoteId) {
    return NextResponse.json({ error: "quote_id_required" }, { status: 400 });
  }

  const record = await getAcquisitionByQuoteId(quoteId, {
    stateToken: acquisitionStateTokenFromRequest(request)
  });
  if (!record) {
    return NextResponse.json({ error: "quote_not_found" }, { status: 404 });
  }

  if (isCommercialQuoteExpired(record.quote)) {
    createCommerceEvent("commerce.audit.quote_expired", { offerId: quoteId });
    return NextResponse.json(
      {
        error: "quote_expired",
        message: "This quote expired. Submit the questionnaire again to generate a fresh quote.",
        regeneratePath: "/get-started"
      },
      { status: 410 }
    );
  }

  // Recompute authoritative amounts from stored answers (never trust stored totals alone).
  const fresh = buildCommercialQuote({
    answers: {
      ...record.answers,
      selectedModule: record.quote.module
    },
    now: new Date(record.quote.created_at),
    quoteId: record.quote.quote_id
  });

  return NextResponse.json({
    quote: {
      ...fresh,
      expires_at: record.quote.expires_at,
      created_at: record.quote.created_at
    },
    snapshot: record.snapshot
  });
}
