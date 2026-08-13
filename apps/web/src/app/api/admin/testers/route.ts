import { NextResponse } from "next/server";
import { isMasterAdminGrantStatus, isProductSku } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../lib/commercial/server";
import {
  createComplimentaryTesterInvitation,
  listComplimentaryGrants
} from "../../../../lib/admin/complimentary-grants";

function durationToExpiration(
  duration: unknown,
  customExpiration: unknown
): { expirationDate: string | null; allowNoExpiration: boolean; error?: string } {
  if (duration === "7d") {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 7);
    return { expirationDate: d.toISOString(), allowNoExpiration: false };
  }
  if (duration === "30d") {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 30);
    return { expirationDate: d.toISOString(), allowNoExpiration: false };
  }
  if (duration === "custom") {
    if (typeof customExpiration !== "string" || !customExpiration) {
      return {
        expirationDate: null,
        allowNoExpiration: false,
        error: "customExpiration is required for custom duration."
      };
    }
    return { expirationDate: customExpiration, allowNoExpiration: false };
  }
  if (duration === "none") {
    return { expirationDate: null, allowNoExpiration: true };
  }
  return {
    expirationDate: null,
    allowNoExpiration: false,
    error: "duration must be one of 7d, 30d, custom, none."
  };
}

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") ?? "all";
  const status = isMasterAdminGrantStatus(statusParam) ? statusParam : "all";

  try {
    const grants = await listComplimentaryGrants({ status });
    return NextResponse.json({ grants });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list grants" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
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
    email?: unknown;
    planGranted?: unknown;
    reason?: unknown;
    notes?: unknown;
    duration?: unknown;
    customExpiration?: unknown;
    allowNoExpiration?: unknown;
    organizationId?: unknown;
  } | null;

  if (!payload || typeof payload.email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  if (!isProductSku(payload.planGranted)) {
    return NextResponse.json({ error: "planGranted must be a product SKU" }, { status: 400 });
  }
  if (typeof payload.reason !== "string") {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }

  const durationResult = durationToExpiration(payload.duration, payload.customExpiration);
  if (durationResult.error) {
    return NextResponse.json({ error: durationResult.error }, { status: 400 });
  }

  const allowNoExpiration =
    durationResult.allowNoExpiration && payload.allowNoExpiration === true;

  if (durationResult.expirationDate == null && !allowNoExpiration) {
    return NextResponse.json(
      { error: "No-expiration grants require allowNoExpiration=true confirmation." },
      { status: 400 }
    );
  }

  const result = await createComplimentaryTesterInvitation({
    operatorUserId: user.id,
    email: payload.email,
    planGranted: payload.planGranted,
    reason: payload.reason,
    notes: typeof payload.notes === "string" ? payload.notes : null,
    expirationDate: durationResult.expirationDate,
    allowNoExpiration,
    organizationId: typeof payload.organizationId === "string" ? payload.organizationId : null
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json(
    { grant: result.grant, acceptUrl: result.acceptUrl },
    { status: 201 }
  );
}
