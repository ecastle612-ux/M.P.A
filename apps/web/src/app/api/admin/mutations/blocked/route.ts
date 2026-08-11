import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { capacityMutationBlocked, mutateOrganizationLifecycle } from "../../../../../lib/admin/ma7-mutation-service";
import { CAPACITY_MUTATION_BLOCKER, ORG_LIFECYCLE_BLOCKER } from "../../../../../lib/admin/ma7-mutations";

export const runtime = "nodejs";

/**
 * MA-7 — organization lifecycle + capacity mutation endpoints.
 * Both are intentionally blocked without inventing unsupported semantics.
 * Auth still enforced so non-operators cannot probe.
 */
export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized", code: "unauthorized" }, { status: 401 });
  }
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "forbidden", code: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    domain?: string;
    organizationId?: string;
    action?: string;
  } | null;

  if (body?.domain === "capacity") {
    const result = capacityMutationBlocked();
    return NextResponse.json(
      {
        ok: false,
        code: result.code,
        message: CAPACITY_MUTATION_BLOCKER,
        correlationId: result.correlationId
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (body?.domain === "organization" || body?.action === "suspend" || body?.action === "reactivate") {
    const result = await mutateOrganizationLifecycle({
      organizationId: body.organizationId ?? "",
      action: body.action === "reactivate" ? "reactivate" : "suspend"
    });
    return NextResponse.json(
      {
        ok: false,
        code: result.code,
        message: ORG_LIFECYCLE_BLOCKER,
        correlationId: result.correlationId,
        blocker: ORG_LIFECYCLE_BLOCKER
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      ok: false,
      code: "invalid_payload",
      message: "Specify domain=organization|capacity (both currently blocked).",
      blockers: {
        organization: ORG_LIFECYCLE_BLOCKER,
        capacity: CAPACITY_MUTATION_BLOCKER
      }
    },
    { status: 400, headers: { "Cache-Control": "no-store" } }
  );
}
