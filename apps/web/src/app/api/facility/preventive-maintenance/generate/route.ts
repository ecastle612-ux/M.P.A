import { NextResponse } from "next/server";
import { generatePmInputSchema } from "@mpa/shared";
import { requireFacilityPreventivePermission } from "../../../../../lib/facility/authz";
import { generateDuePreventiveWork } from "../../../../../lib/facility/pm-generation-service";
import { createServiceRoleClient } from "../../../../../lib/supabase/service-role";

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  return generate(request);
}

export async function GET(request: Request) {
  return generate(request);
}

async function generate(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const parsed = generatePmInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (cronAuthorized(request)) {
    try {
      const supabase = createServiceRoleClient();
      const result = await generateDuePreventiveWork(supabase, {
        organizationId: parsed.data.organizationId,
        planId: parsed.data.planId,
        ...(parsed.data.now ? { now: new Date(parsed.data.now) } : {})
      });
      return NextResponse.json({ result, actor: "scheduler" });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Generation failed" },
        { status: 400 }
      );
    }
  }

  const authz = await requireFacilityPreventivePermission();
  if ("error" in authz) return authz.error;
  try {
    const result = await generateDuePreventiveWork(authz.supabase, {
      organizationId: authz.organizationId,
      planId: parsed.data.planId,
      ...(parsed.data.now ? { now: new Date(parsed.data.now) } : {})
    });
    return NextResponse.json({ result, actor: "manager" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 400 }
    );
  }
}
