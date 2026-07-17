import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import {
  parseCreateExpenseInput,
  type ExpenseCategory,
  type ExpenseStatus
} from "../../../lib/financial/contracts";
import {
  createExpense,
  getExpensesForOrganization,
  type ExpenseListOptions
} from "../../../lib/financial/server";
import { apiError, apiInternalError, parseJsonBody, parsePaginationParams } from "../../../lib/api/http";

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
    const status = url.searchParams.get("status");
    if (status === "pending" || status === "approved" || status === "paid" || status === "archived" || status === "all") {
      options.status = status as ExpenseStatus | "all";
    }
    const category = url.searchParams.get("category");
    if (
      category === "maintenance" ||
      category === "vendor_bill" ||
      category === "utilities" ||
      category === "insurance" ||
      category === "taxes" ||
      category === "repairs" ||
      category === "capital_improvement" ||
      category === "custom" ||
      category === "all"
    ) {
      options.category = category as ExpenseCategory | "all";
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
