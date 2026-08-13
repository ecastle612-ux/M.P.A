/**
 * Signed durable acquisition-quote cookie (BUG-009 pattern).
 * Process memory is only a cache; this token survives Vercel isolate replacement.
 * Pricing remains server-authored — HMAC prevents client tampering.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import {
  ACQUISITION_QUOTE_STATE_COOKIE,
  COMMERCIAL_QUOTE_TTL_MS,
  isBillingCycle,
  isCommercialQuoteExpired,
  isProductSku,
  type AcquisitionSnapshot,
  type CommercialQuote,
  type ValidatedAcquisitionAnswers
} from "@mpa/shared";

export type DurableAcquisitionRecord = {
  quote: CommercialQuote;
  snapshot: AcquisitionSnapshot;
  answers: ValidatedAcquisitionAnswers;
};

const MAX_COOKIE_BYTES = 3500;

type DurableAcquisitionState = {
  v: 1;
  quote: CommercialQuote;
  answers: ValidatedAcquisitionAnswers;
  snapshot_id: string;
};

function signingSecret(): string {
  return (
    process.env["COMMERCIAL_QUOTE_SECRET"]?.trim() ||
    process.env["NEXTAUTH_SECRET"]?.trim() ||
    process.env["AUTH_SECRET"]?.trim() ||
    "mpa-acquisition-quote-dev-secret"
  );
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", signingSecret()).update(payloadB64).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function rebuildSnapshot(quote: CommercialQuote, snapshotId: string): AcquisitionSnapshot {
  return {
    snapshot_id: snapshotId,
    quote,
    declared_units: quote.managed_units,
    operational_need: quote.operational_need,
    recommended_module: quote.recommendation.recommendedModule,
    selected_module: quote.module,
    billing_interval: quote.billing_interval,
    trial_eligible: quote.trial_eligible,
    created_at: quote.created_at
  };
}

function isValidAnswers(value: unknown): value is ValidatedAcquisitionAnswers {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row["managedUnits"] === "number" &&
    Number.isInteger(row["managedUnits"]) &&
    row["managedUnits"] > 0 &&
    (row["operationalNeed"] === "property_resident_leasing" ||
      row["operationalNeed"] === "facility_maintenance" ||
      row["operationalNeed"] === "both") &&
    isBillingCycle(row["billingInterval"])
  );
}

function isValidQuote(value: unknown): value is CommercialQuote {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row["quote_id"] === "string" &&
    row["quote_id"].length > 0 &&
    isProductSku(row["module"]) &&
    isBillingCycle(row["billing_interval"]) &&
    typeof row["managed_units"] === "number" &&
    typeof row["monthly_amount"] === "number" &&
    typeof row["annual_amount"] === "number" &&
    typeof row["created_at"] === "string" &&
    typeof row["expires_at"] === "string" &&
    row["stripe_objects_created"] === false
  );
}

export function encodeAcquisitionQuoteState(record: DurableAcquisitionRecord): string | null {
  const state: DurableAcquisitionState = {
    v: 1,
    quote: record.quote,
    answers: record.answers,
    snapshot_id: record.snapshot.snapshot_id
  };
  const payloadB64 = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  const token = `${payloadB64}.${signPayload(payloadB64)}`;
  if (Buffer.byteLength(token, "utf8") > MAX_COOKIE_BYTES) {
    return null;
  }
  return token;
}

export function decodeAcquisitionQuoteState(
  token: string | undefined | null
): DurableAcquisitionRecord | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const payloadB64 = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!safeEqual(signPayload(payloadB64), signature)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as DurableAcquisitionState;
    if (parsed.v !== 1 || !isValidQuote(parsed.quote) || !isValidAnswers(parsed.answers)) {
      return null;
    }
    if (typeof parsed.snapshot_id !== "string" || !parsed.snapshot_id.startsWith("as_")) {
      return null;
    }
    return {
      quote: parsed.quote,
      answers: parsed.answers,
      snapshot: rebuildSnapshot(parsed.quote, parsed.snapshot_id)
    };
  } catch {
    return null;
  }
}

export function acquisitionQuoteCookieMaxAgeSeconds(record: DurableAcquisitionRecord): number {
  const expires = Date.parse(record.quote.expires_at);
  if (!Number.isFinite(expires)) {
    return Math.floor(COMMERCIAL_QUOTE_TTL_MS / 1000);
  }
  const seconds = Math.floor((expires - Date.now()) / 1000);
  if (seconds <= 0) return 0;
  return Math.min(seconds, Math.floor(COMMERCIAL_QUOTE_TTL_MS / 1000));
}

export function applyAcquisitionQuoteCookies(
  response: NextResponse,
  record: DurableAcquisitionRecord
): boolean {
  const token = encodeAcquisitionQuoteState(record);
  if (!token) return false;
  const maxAge = acquisitionQuoteCookieMaxAgeSeconds(record);
  if (maxAge <= 0 || isCommercialQuoteExpired(record.quote)) {
    clearAcquisitionQuoteStateCookie(response);
    return false;
  }
  response.cookies.set(ACQUISITION_QUOTE_STATE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge
  });
  return true;
}

export function clearAcquisitionQuoteStateCookie(response: NextResponse): void {
  response.cookies.set(ACQUISITION_QUOTE_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: 0
  });
}
