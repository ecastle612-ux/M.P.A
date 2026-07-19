import { NextResponse, type NextRequest } from "next/server";
import { getRequestId, log } from "../../../../lib/observability";

const MAX_REPORT_CHARS = 2000;

function summarize(report: unknown): string {
  try {
    return JSON.stringify(report).slice(0, MAX_REPORT_CHARS);
  } catch {
    return "unserializable-report";
  }
}

/**
 * Content-Security-Policy violation report sink (`report-uri` / Reporting API `report-to`).
 * Makes CSP violations observable — the documented path toward a strict, nonce-based CSP.
 * Always returns 204 and never throws.
 */
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers);
  try {
    const report: unknown = await request.json().catch(() => null);
    log("warn", "csp_violation", {
      requestId,
      module: "security.csp",
      report: summarize(report)
    });
  } catch {
    // ignore — reporting must never error
  }
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
