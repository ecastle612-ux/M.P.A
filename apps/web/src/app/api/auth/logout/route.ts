import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";

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
  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    },
  );
}
