import { handleOpportunityAction } from "../../../../../../lib/partners/opportunity-api";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await context.params;
  return handleOpportunityAction(request, "facility", opportunityId);
}

export async function PATCH(request: Request, context: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await context.params;
  return handleOpportunityAction(request, "facility", opportunityId);
}
