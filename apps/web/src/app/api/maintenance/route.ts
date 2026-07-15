import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { parseCreateWorkOrderInput } from "../../../lib/maintenance/contracts";
import { createWorkOrder, getWorkOrdersForOrganization } from "../../../lib/maintenance/server";
import { apiError, apiInternalError, parseJsonBody, parsePaginationParams } from "../../../lib/api/http";
import type { MaintenancePriority, MaintenanceStatus } from "../../../lib/maintenance/contracts";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
    }

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url.searchParams);
    const search = url.searchParams.get("search") ?? undefined;
    const statusRaw = url.searchParams.get("status");
    const priorityRaw = url.searchParams.get("priority");
    const propertyId = url.searchParams.get("propertyId") ?? undefined;
    const unitId = url.searchParams.get("unitId") ?? undefined;
    const tenantId = url.searchParams.get("tenantId") ?? undefined;
    const sortByRaw = url.searchParams.get("sortBy");
    const sortOrderRaw = url.searchParams.get("sortOrder");

    const status =
      statusRaw === "open" || statusRaw === "all"
        ? statusRaw
        : isMaintenanceStatus(statusRaw)
          ? statusRaw
          : undefined;
    const priority = isMaintenancePriority(priorityRaw) ? priorityRaw : undefined;
    const sortBy =
      sortByRaw === "due_date" || sortByRaw === "priority" || sortByRaw === "created_at" || sortByRaw === "updated_at"
        ? sortByRaw
        : undefined;
    const sortOrder = sortOrderRaw === "asc" || sortOrderRaw === "desc" ? sortOrderRaw : undefined;

    const options = { ...pagination } as {
      limit?: number;
      offset?: number;
      search?: string;
      status?: MaintenanceStatus | "open" | "all";
      priority?: MaintenancePriority;
      propertyId?: string;
      unitId?: string;
      tenantId?: string;
      sortBy?: "updated_at" | "due_date" | "priority" | "created_at";
      sortOrder?: "asc" | "desc";
    };
    if (search?.trim()) options.search = search;
    if (status) options.status = status;
    if (priority) options.priority = priority;
    if (propertyId) options.propertyId = propertyId;
    if (unitId) options.unitId = unitId;
    if (tenantId) options.tenantId = tenantId;
    if (sortBy) options.sortBy = sortBy;
    if (sortOrder) options.sortOrder = sortOrder;

    const items = await getWorkOrdersForOrganization(organizationId, options, supabase);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
    }

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "maintenance:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const input = parseCreateWorkOrderInput(parsedBody.payload);
    if (!input) {
      return apiError(400, "INVALID_PAYLOAD", "Invalid work order payload");
    }

    const workOrder = await createWorkOrder(organizationId, user.id, input, supabase);
    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Work order creation failed";
    return apiError(400, "WORK_ORDER_CREATE_FAILED", message);
  }
}

function isMaintenanceStatus(value: string | null): value is MaintenanceStatus {
  return (
    value === "submitted" ||
    value === "triaged" ||
    value === "assigned" ||
    value === "in_progress" ||
    value === "on_hold" ||
    value === "completed" ||
    value === "cancelled"
  );
}

function isMaintenancePriority(value: string | null): value is MaintenancePriority {
  return value === "low" || value === "medium" || value === "high" || value === "emergency";
}
