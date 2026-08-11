import {
  listPlatformErrorEvents,
  getPlatformErrorEventById,
  type PlatformErrorEventRow
} from "../observability/durable-errors";
import {
  parsePlatformErrorFilters,
  toSafePlatformErrorDto,
  RESOLUTION_LIMITATION,
  type SafePlatformErrorDto
} from "./platform-errors";

export type PlatformErrorsListResult = {
  errors: SafePlatformErrorDto[];
  degraded: boolean;
  detail?: string;
  rangeLabel: string;
  resolutionLimitation: string;
  filters: {
    severity: string;
    organizationId?: string;
    routeContains?: string;
    range: string;
  };
};

export async function loadPlatformErrorsList(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): Promise<PlatformErrorsListResult> {
  const parsed = parsePlatformErrorFilters(searchParams);
  const rangeParam =
    searchParams instanceof URLSearchParams
      ? searchParams.get("range") ?? "24h"
      : Array.isArray(searchParams["range"])
        ? searchParams["range"][0] ?? "24h"
        : searchParams["range"] ?? "24h";

  const query: Parameters<typeof listPlatformErrorEvents>[0] = {
    limit: 100
  };
  if (parsed.severity && parsed.severity !== "all") query.severity = parsed.severity;
  if (parsed.organizationId) query.organizationId = parsed.organizationId;
  if (parsed.since) query.since = parsed.since;
  if (parsed.until) query.until = parsed.until;
  if (parsed.routeContains) query.routeContains = parsed.routeContains;

  const { rows, degraded, detail } = await listPlatformErrorEvents(query);

  const filters: PlatformErrorsListResult["filters"] = {
    severity: parsed.severity ?? "all",
    range: rangeParam
  };
  if (parsed.organizationId) filters.organizationId = parsed.organizationId;
  if (parsed.routeContains) filters.routeContains = parsed.routeContains;

  const result: PlatformErrorsListResult = {
    errors: rows.map(toSafePlatformErrorDto),
    degraded,
    rangeLabel: parsed.rangeLabel,
    resolutionLimitation: RESOLUTION_LIMITATION,
    filters
  };
  if (detail) result.detail = detail;
  return result;
}

export async function loadPlatformErrorDetail(
  errorId: string
): Promise<{ error: SafePlatformErrorDto | null; degraded: boolean; detail?: string }> {
  const { row, degraded, detail } = await getPlatformErrorEventById(errorId);
  if (!row) {
    const out: { error: SafePlatformErrorDto | null; degraded: boolean; detail?: string } = {
      error: null,
      degraded
    };
    if (detail) out.detail = detail;
    return out;
  }
  return { error: toSafePlatformErrorDto(row as PlatformErrorEventRow), degraded: false };
}
