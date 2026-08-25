import { handlePartnerOpportunityDetail } from "../../../../../lib/partners/opportunity-api";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await context.params;
  return handlePartnerOpportunityDetail(request, opportunityId);
}

export async function POST(request: Request, context: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await context.params;
  return handlePartnerOpportunityDetail(request, opportunityId);
}
