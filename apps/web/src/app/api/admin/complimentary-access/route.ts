import { NextResponse } from "next/server";
import { isComplimentaryDurationId, isComplimentaryLimitMode } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../lib/commercial/server";
import {
  expireDueComplimentaryGrants,
  listComplimentaryGrantEvents,
  listComplimentaryGrants,
  mutateComplimentaryGrant,
  notifyUpcomingComplimentaryExpirations,
  resendComplimentaryAccess,
  sendComplimentaryAccess,
  toPublicComplimentaryGrant
} from "../../../../lib/complimentary-access/service";
import {
  createRuntimeComplimentaryDeps,
  loadRuntimeComplimentaryStore,
  persistRuntimeComplimentaryState
} from "../../../../lib/complimentary-access/runtime";

async function requireOperator() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }
  if (!(await isPlatformOperatorUser(user))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const auth = await requireOperator();
  if ("error" in auth) {
    return auth.error;
  }
  const store = await loadRuntimeComplimentaryStore();
  const deps = await createRuntimeComplimentaryDeps(store);
  expireDueComplimentaryGrants(deps);
  await notifyUpcomingComplimentaryExpirations(deps);
  await persistRuntimeComplimentaryState(store);
  return NextResponse.json({
    grants: listComplimentaryGrants(deps).map((grant) => ({
      ...toPublicComplimentaryGrant(grant),
      events: listComplimentaryGrantEvents(grant.id, deps)
    }))
  });
}

export async function POST(request: Request) {
  const auth = await requireOperator();
  if ("error" in auth) {
    return auth.error;
  }
  const body = await request.json().catch(() => null);
  const store = await loadRuntimeComplimentaryStore();
  const deps = await createRuntimeComplimentaryDeps(store);
  const result = await sendComplimentaryAccess(body, auth.user.id, deps);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  await persistRuntimeComplimentaryState(store);
  return NextResponse.json({
    grant: toPublicComplimentaryGrant(result.grant),
    resent: result.resent
  });
}

export async function PATCH(request: Request) {
  const auth = await requireOperator();
  if ("error" in auth) {
    return auth.error;
  }
  const body = (await request.json().catch(() => null)) as {
    grantId?: string;
    action?: string;
    durationId?: string;
    limitMode?: string;
    customUnitLimit?: number | null;
  } | null;
  if (!body?.grantId || !body.action) {
    return NextResponse.json({ error: "grantId and action required" }, { status: 400 });
  }
  const store = await loadRuntimeComplimentaryStore();
  const deps = await createRuntimeComplimentaryDeps(store);

  if (body.action === "resend") {
    const result = await resendComplimentaryAccess(body.grantId, auth.user.id, deps);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await persistRuntimeComplimentaryState(store);
    return NextResponse.json({ grant: toPublicComplimentaryGrant(result.grant) });
  }

  if (body.action === "extend") {
    if (!isComplimentaryDurationId(body.durationId)) {
      return NextResponse.json({ error: "invalid_duration" }, { status: 400 });
    }
    const result = mutateComplimentaryGrant(
      body.grantId,
      auth.user.id,
      { type: "extend", durationId: body.durationId },
      deps
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await persistRuntimeComplimentaryState(store);
    return NextResponse.json({ grant: toPublicComplimentaryGrant(result.grant) });
  }

  if (body.action === "change_limit") {
    if (!isComplimentaryLimitMode(body.limitMode)) {
      return NextResponse.json({ error: "invalid_limit_mode" }, { status: 400 });
    }
    const result = mutateComplimentaryGrant(
      body.grantId,
      auth.user.id,
      { type: "change_limit", limitMode: body.limitMode, customUnitLimit: body.customUnitLimit ?? null },
      deps
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await persistRuntimeComplimentaryState(store);
    return NextResponse.json({ grant: toPublicComplimentaryGrant(result.grant) });
  }

  if (body.action === "remove_expiration" || body.action === "revoke" || body.action === "convert_to_gift") {
    const result = mutateComplimentaryGrant(body.grantId, auth.user.id, { type: body.action }, deps);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await persistRuntimeComplimentaryState(store);
    return NextResponse.json({ grant: toPublicComplimentaryGrant(result.grant) });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
