import { NextResponse } from "next/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";
import { startVendorJob, type ArrivalLocation } from "../../../../../lib/vendor-jobs/server";

function parseLocation(value: unknown): ArrivalLocation | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const latitudeRaw = record["latitude"];
  const longitudeRaw = record["longitude"];
  const latitude = typeof latitudeRaw === "number" ? latitudeRaw : Number(latitudeRaw);
  const longitude = typeof longitudeRaw === "number" ? longitudeRaw : Number(longitudeRaw);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  const accuracyRaw = record["accuracyM"] ?? record["accuracy"];
  const accuracyM =
    typeof accuracyRaw === "number"
      ? accuracyRaw
      : typeof accuracyRaw === "string"
        ? Number(accuracyRaw)
        : null;
  return {
    latitude,
    longitude,
    accuracyM: Number.isFinite(accuracyM as number) ? (accuracyM as number) : null
  };
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!token || token.length < 16) {
      return apiError(404, "NOT_FOUND", "Job link not found");
    }

    const parsedBody = await parseJsonBody(request);
    const payload = parsedBody.ok ? (parsedBody.payload as Record<string, unknown>) : {};

    const card = await startVendorJob(token, {
      userAgent: request.headers.get("user-agent"),
      location: parseLocation(payload["location"]),
      clientTimestamp: typeof payload["clientTimestamp"] === "string" ? payload["clientTimestamp"] : null
    });

    return NextResponse.json({ job: card });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === "number" ? (error as { status: number }).status : 500;
    const message = error instanceof Error ? error.message : "Unable to start job";
    if (status === 404 || status === 409 || status === 410) {
      return apiError(status, "START_FAILED", message);
    }
    return apiInternalError();
  }
}
