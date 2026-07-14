import { NextResponse } from "next/server";

type ErrorPayload = {
  error: string;
  code: string;
};

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json<ErrorPayload>({ error: message, code }, { status });
}

export function apiInternalError() {
  return apiError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
}

export async function parseJsonBody(request: Request) {
  try {
    const payload = (await request.json()) as unknown;
    return { ok: true as const, payload };
  } catch {
    return {
      ok: false as const,
      response: apiError(400, "INVALID_JSON", "Malformed JSON payload.")
    };
  }
}

export function parsePaginationParams(searchParams: URLSearchParams): {
  limit?: number;
  offset?: number;
} {
  const limitRaw = searchParams.get("limit");
  const offsetRaw = searchParams.get("offset");

  const parsedLimit = limitRaw ? Number.parseInt(limitRaw, 10) : NaN;
  const parsedOffset = offsetRaw ? Number.parseInt(offsetRaw, 10) : NaN;

  const options: { limit?: number; offset?: number } = {};
  if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
    options.limit = Math.min(parsedLimit, 250);
  }
  if (Number.isFinite(parsedOffset) && parsedOffset >= 0) {
    options.offset = parsedOffset;
  }
  return options;
}
