import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { parseCreateExpenseInput } from "../../../../lib/financial/contracts";
import { createExpense, getExpensesForOrganization, type ExpenseListOptions } from "../../../../lib/financial/server";
import { apiError, apiInternalError, parseJsonBody, parsePaginationParams } from "../../../../lib/api/http";

export async function GET(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "financial:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const url = new URL(request.url);
    const pagination = parsePaginationParams(url.searchParams);
    const options: ExpenseListOptions = { ...pagination };

    const statusRaw = url.searchParams.get("status");
    if (
      statusRaw === "pending" ||
      statusRaw === "approved" ||
      statusRaw === "paid" ||
      statusRaw === "archived" ||
      statusRaw === "all"
    ) {
      options.status = statusRaw;
    }

    const categoryRaw = url.searchParams.get("category");
    if (
      categoryRaw === "maintenance" ||
      categoryRaw === "vendor_bill" ||
      categoryRaw === "utilities" ||
      categoryRaw === "insurance" ||
      categoryRaw === "taxes" ||
      categoryRaw === "repairs" ||
      categoryRaw === "capital_improvement" ||
      categoryRaw === "custom" ||
      categoryRaw === "all"
    ) {
      options.category = categoryRaw;
    }

    const search = url.searchParams.get("search");
    if (search?.trim()) options.search = search;

    const propertyId = url.searchParams.get("propertyId");
    if (propertyId) options.propertyId = propertyId;

    const items = await getExpensesForOrganization(organizationId, options, supabase);
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
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization selected");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "financial:create")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsedBody = await parseJsonBody(request);
    if (!parsedBody.ok) return parsedBody.response;

    const input = parseCreateExpenseInput(parsedBody.payload);
    if (!input) return apiError(400, "INVALID_PAYLOAD", "Invalid expense payload");

    const expense = await createExpense(organizationId, user.id, input, supabase);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Expense creation failed";
    return apiError(400, "EXPENSE_CREATE_FAILED", message);
  }
}
