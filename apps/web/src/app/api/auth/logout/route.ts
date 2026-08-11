import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { IMPERSONATION_COOKIE, IMPERSONATION_MODE_COOKIE } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { clearDemoCookies } from "../../../../lib/demo/durable-state";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../lib/organization/contracts";

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: 0
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const requestOrigin = request.nextUrl.origin;
  if (origin) {
    try {
      const parsedOrigin = new URL(origin).origin;
      if (parsedOrigin !== requestOrigin) {
        return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });
    }
  }

  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  const response = NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
  // STAB-001 / STAB-011 — clear org + impersonation + demo cookies so the next session
  // cannot inherit privileged context.
  clearCookie(response, ACTIVE_ORGANIZATION_COOKIE);
  clearCookie(response, IMPERSONATION_COOKIE);
  clearCookie(response, IMPERSONATION_MODE_COOKIE);
  clearDemoCookies(response);
  return response;
}
