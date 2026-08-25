import { handleSelectPartner } from "../../../../../../../lib/partners/opportunity-api";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId } = await context.params;
  return handleSelectPartner(request, "facility", opportunityId);
}
