import { handleListCreateOpportunities } from "../../../../../lib/partners/opportunity-api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleListCreateOpportunities(request, "facility");
}

export async function POST(request: Request) {
  return handleListCreateOpportunities(request, "facility");
}
