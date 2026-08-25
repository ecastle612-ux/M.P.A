import { handlePartnerOpportunityList } from "../../../../lib/partners/opportunity-api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handlePartnerOpportunityList(request);
}
