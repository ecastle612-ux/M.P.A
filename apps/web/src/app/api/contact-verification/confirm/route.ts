import { NextResponse } from "next/server";
import { confirmContactVerification } from "../../../../lib/auth/contact-verification";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const token =
    payload && typeof payload === "object" && typeof (payload as { token?: unknown }).token === "string"
      ? String((payload as { token: string }).token).trim()
      : "";

  if (!token) {
    return NextResponse.json({ error: "Verification token required" }, { status: 400 });
  }

  try {
    const result = await confirmContactVerification(token);
    return NextResponse.json({ ok: true, userId: result.userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
