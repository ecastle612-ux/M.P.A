import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import {
  extendComplimentaryGrant,
  revokeComplimentaryGrant
} from "../../../../../lib/admin/complimentary-grants";

type RouteContext = {
  params: Promise<{ grantId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { grantId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as {
    action?: unknown;
    expirationDate?: unknown;
    allowNoExpiration?: unknown;
  } | null;

  if (!payload || payload.action !== "extend") {
    return NextResponse.json({ error: "action must be extend" }, { status: 400 });
  }

  const expirationDate =
    payload.expirationDate === null
      ? null
      : typeof payload.expirationDate === "string"
        ? payload.expirationDate
        : undefined;

  if (expirationDate === undefined) {
    return NextResponse.json(
      { error: "expirationDate is required (ISO string or null)." },
      { status: 400 }
    );
  }

  const result = await extendComplimentaryGrant({
    operatorUserId: user.id,
    grantId,
    expirationDate,
    allowNoExpiration: payload.allowNoExpiration === true
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({ grant: result.grant });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { grantId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await revokeComplimentaryGrant({
    operatorUserId: user.id,
    grantId
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({ grant: result.grant });
}
