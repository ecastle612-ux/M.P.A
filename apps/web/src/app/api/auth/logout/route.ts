import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../lib/organization/contracts";

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
  // Clear org context so the next account cannot inherit a stale active org (STAB-001).
  response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
