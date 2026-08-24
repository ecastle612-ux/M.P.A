import { NextResponse } from "next/server";
import {
  PARTNER_REQUEST_STATUS_LABELS,
  PARTNER_SERVICE_CATEGORY_LABELS,
  PARTNER_REQUEST_URGENCY_LABELS
} from "@mpa/shared";
import { requirePartnerServicesRead } from "../../../../lib/partners/authz";
import { loadPartnerRequestDeps } from "../../../../lib/partners/request-deps";
import { listPartnerRequestsForOrganization, requestQueueStatus } from "../../../../lib/partners/request-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authz = await requirePartnerServicesRead();
  if ("error" in authz) return authz.error;

  const deps = await loadPartnerRequestDeps();
  const { partners, requests } = await listPartnerRequestsForOrganization(authz.organizationId, deps);
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab");
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const filtered = requests.filter((row) => {
    const queue = requestQueueStatus(row.status);
    if (tab === "new" && queue !== "new") return false;
    if (tab === "accepted" && queue !== "accepted") return false;
    if (tab === "converted" && queue !== "converted") return false;
    if (tab === "declined" && queue !== "declined") return false;
    if (!q) return true;
    return [row.requesterName, row.propertyAddress, row.publicRef, row.category, row.description]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return NextResponse.json({
    partners: partners.map((partner) => ({
      id: partner.id,
      companyName: partner.companyName,
      publicSlug: partner.publicSlug,
      publicPortalEnabled: partner.publicPortalEnabled,
      status: partner.status
    })),
    requests: filtered.map((row) => ({
      id: row.id,
      publicRef: row.publicRef,
      requesterName: row.requesterName,
      propertyAddress: row.propertyAddress,
      unitLabel: row.unitLabel,
      category: row.category,
      categoryLabel: PARTNER_SERVICE_CATEGORY_LABELS[row.category],
      urgency: row.urgency,
      urgencyLabel: PARTNER_REQUEST_URGENCY_LABELS[row.urgency],
      status: row.status,
      statusLabel: PARTNER_REQUEST_STATUS_LABELS[row.status],
      queue: requestQueueStatus(row.status),
      createdAt: row.createdAt,
      convertedWorkOrderId: row.convertedWorkOrderId,
      convertedWorkSurface: row.convertedWorkSurface
    }))
  });
}
