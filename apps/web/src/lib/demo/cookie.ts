import { DEMO_SESSION_COOKIE, DEMO_SESSION_TTL_MS } from "@mpa/shared";
import { cookies } from "next/headers";
import { DEMO_STATE_COOKIE } from "./durable-state";

export { DEMO_SESSION_COOKIE, DEMO_STATE_COOKIE };

export async function readDemoSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(DEMO_SESSION_COOKIE)?.value ?? null;
}

export async function readDemoStateToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(DEMO_STATE_COOKIE)?.value ?? null;
}

export async function readDemoCookiePair(): Promise<{
  sessionId: string | null;
  stateToken: string | null;
}> {
  const jar = await cookies();
  return {
    sessionId: jar.get(DEMO_SESSION_COOKIE)?.value ?? null,
    stateToken: jar.get(DEMO_STATE_COOKIE)?.value ?? null
  };
}

export function demoSessionCookieOptions() {
  return {
    name: DEMO_SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: Math.floor(DEMO_SESSION_TTL_MS / 1000)
  };
}
