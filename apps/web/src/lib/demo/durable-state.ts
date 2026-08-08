import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_TTL_MS,
  isDemoSessionExpired,
  type DemoOverlayStore,
  type DemoSession
} from "@mpa/shared";

/** Signed cookie carrying demo session state across serverless isolates. */
export const DEMO_STATE_COOKIE = "mpa_demo_state";

const MAX_COOKIE_BYTES = 3500;

export type DemoStoredSession = {
  session: DemoSession;
  overlay: DemoOverlayStore;
  analytics: Array<{ event: string; at: string; meta?: Record<string, string> }>;
};

type DurableDemoState = {
  v: 1;
  session: DemoSession;
  overlay: DemoOverlayStore;
  analytics: DemoStoredSession["analytics"];
};

function signingSecret(): string {
  return (
    process.env["DEMO_SESSION_SECRET"]?.trim() ||
    process.env["NEXTAUTH_SECRET"]?.trim() ||
    process.env["AUTH_SECRET"]?.trim() ||
    "mpa-demo-dev-secret"
  );
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", signingSecret()).update(payloadB64).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function packToken(state: DurableDemoState): string | null {
  const payloadB64 = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
  const token = `${payloadB64}.${signPayload(payloadB64)}`;
  if (Buffer.byteLength(token, "utf8") <= MAX_COOKIE_BYTES) {
    return token;
  }
  return null;
}

/** Encode session+overlay for the durable cookie (trims analytics/ops if needed). */
export function encodeDemoSessionState(row: DemoStoredSession): string | null {
  const attempts: DurableDemoState[] = [
    {
      v: 1,
      session: row.session,
      overlay: row.overlay,
      analytics: row.analytics.slice(-40)
    },
    {
      v: 1,
      session: row.session,
      overlay: {
        ...row.overlay,
        ops: row.overlay.ops.slice(-20)
      },
      analytics: row.analytics.slice(-12)
    },
    {
      v: 1,
      session: row.session,
      overlay: {
        sessionId: row.session.id,
        ops: [],
        updatedAt: row.overlay.updatedAt
      },
      analytics: row.analytics.slice(-4)
    }
  ];

  for (const state of attempts) {
    const token = packToken(state);
    if (token) return token;
  }
  return null;
}

export function decodeDemoSessionState(
  token: string | undefined | null
): DemoStoredSession | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const payloadB64 = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!safeEqual(signPayload(payloadB64), signature)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as DurableDemoState;
    if (parsed.v !== 1 || !parsed.session?.id || !parsed.session.product) {
      return null;
    }
    if (isDemoSessionExpired(parsed.session)) {
      return null;
    }
    return {
      session: parsed.session,
      overlay: parsed.overlay ?? {
        sessionId: parsed.session.id,
        ops: [],
        updatedAt: parsed.session.createdAt
      },
      analytics: Array.isArray(parsed.analytics) ? parsed.analytics : []
    };
  } catch {
    return null;
  }
}

export function demoCookieMaxAgeSeconds(): number {
  return Math.floor(DEMO_SESSION_TTL_MS / 1000);
}

export function applyDemoCookies(response: NextResponse, row: DemoStoredSession): void {
  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: demoCookieMaxAgeSeconds()
  };

  response.cookies.set(DEMO_SESSION_COOKIE, row.session.id, common);

  const stateToken = encodeDemoSessionState(row);
  if (stateToken) {
    response.cookies.set(DEMO_STATE_COOKIE, stateToken, common);
  }
}

export function clearDemoCookies(response: NextResponse): void {
  const clear = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: 0
  };
  response.cookies.set(DEMO_SESSION_COOKIE, "", clear);
  response.cookies.set(DEMO_STATE_COOKIE, "", clear);
}
