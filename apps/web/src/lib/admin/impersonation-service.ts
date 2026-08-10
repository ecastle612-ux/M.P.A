import {
  IMPERSONATION_COOKIE,
  IMPERSONATION_HOME_BY_ROLE,
  IMPERSONATION_MODE_COOKIE,
  isImpersonationTargetRole,
  type ImpersonationTargetRole
} from "@mpa/shared";
import { cookies } from "next/headers";
import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";
import { ACTIVE_ORGANIZATION_COOKIE } from "../organization/contracts";

type LooseClient = {
  from: (table: string) => any;
};

async function tryServiceRole(): Promise<LooseClient | null> {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient() as unknown as LooseClient;
  } catch {
    return null;
  }
}

async function dbClient(): Promise<LooseClient> {
  const service = await tryServiceRole();
  if (service) return service;
  return (await createAuthServerClient()) as unknown as LooseClient;
}

export type ImpersonationSessionView = {
  id: string;
  organizationId: string;
  organizationName: string;
  targetRole: ImpersonationTargetRole;
  mode: "read_only" | "write_enabled";
  startedAt: string;
  homeHref: string;
};

export async function writeSupportAudit(args: {
  operatorUserId: string;
  organizationId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const client = await dbClient();
  await client.from("platform_support_audit_events").insert({
    operator_user_id: args.operatorUserId,
    organization_id: args.organizationId ?? null,
    action: args.action,
    entity_type: args.entityType,
    entity_id: args.entityId ?? null,
    payload: args.payload ?? {}
  });
}

export async function startImpersonationSession(args: {
  operatorUserId: string;
  organizationId: string;
  targetRole: string;
  reason?: string;
  mode?: "read_only" | "write_enabled";
}): Promise<{ session: ImpersonationSessionView; homeHref: string }> {
  if (!isImpersonationTargetRole(args.targetRole)) {
    throw new Error("Unsupported View As role.");
  }
  const mode = args.mode ?? "read_only";
  const client = await dbClient();

  const { data: org, error: orgError } = await (client as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{
            data: { id: string; name: string } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  })
    .from("organizations")
    .select("id, name")
    .eq("id", args.organizationId)
    .maybeSingle();
  if (orgError) throw new Error(orgError.message);
  if (!org) throw new Error("Organization not found.");

  await client
    .from("platform_impersonation_sessions")
    .update({
      ended_at: new Date().toISOString(),
      ended_by: args.operatorUserId
    })
    .eq("operator_user_id", args.operatorUserId)
    .is("ended_at", null);

  const { data: session, error } = await client
    .from("platform_impersonation_sessions")
    .insert({
      operator_user_id: args.operatorUserId,
      organization_id: args.organizationId,
      target_role: args.targetRole,
      mode,
      reason: args.reason ?? null
    })
    .select("id, organization_id, target_role, mode, started_at")
    .single();
  if (error) throw new Error(error.message);
  if (!session) throw new Error("Failed to create impersonation session.");

  await writeSupportAudit({
    operatorUserId: args.operatorUserId,
    organizationId: args.organizationId,
    action: "impersonation.started",
    entityType: "platform_impersonation_sessions",
    entityId: String(session["id"]),
    payload: {
      targetRole: args.targetRole,
      mode,
      reason: args.reason ?? null
    }
  });

  const jar = await cookies();
  jar.set(IMPERSONATION_COOKIE, String(session["id"]), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: 60 * 60 * 4
  });
  jar.set(IMPERSONATION_MODE_COOKIE, mode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: 60 * 60 * 4
  });
  jar.set(ACTIVE_ORGANIZATION_COOKIE, args.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: 60 * 60 * 4
  });

  const homeHref = IMPERSONATION_HOME_BY_ROLE[args.targetRole];
  return {
    session: {
      id: String(session["id"]),
      organizationId: args.organizationId,
      organizationName: org.name,
      targetRole: args.targetRole,
      mode,
      startedAt: String(session["started_at"]),
      homeHref
    },
    homeHref
  };
}

export async function endImpersonationSession(operatorUserId: string): Promise<void> {
  const jar = await cookies();
  const sessionId = jar.get(IMPERSONATION_COOKIE)?.value ?? null;
  const client = await dbClient();

  if (sessionId) {
    const { data: existing } = await client
      .from("platform_impersonation_sessions")
      .select("id, organization_id")
      .eq("id", sessionId)
      .eq("operator_user_id", operatorUserId)
      .maybeSingle();
    await client
      .from("platform_impersonation_sessions")
      .update({
        ended_at: new Date().toISOString(),
        ended_by: operatorUserId
      })
      .eq("id", sessionId)
      .eq("operator_user_id", operatorUserId)
      .is("ended_at", null);
    if (existing) {
      await writeSupportAudit({
        operatorUserId,
        organizationId: (existing["organization_id"] as string | null) ?? null,
        action: "impersonation.ended",
        entityType: "platform_impersonation_sessions",
        entityId: sessionId
      });
    }
  } else {
    await client
      .from("platform_impersonation_sessions")
      .update({
        ended_at: new Date().toISOString(),
        ended_by: operatorUserId
      })
      .eq("operator_user_id", operatorUserId)
      .is("ended_at", null);
  }

  jar.delete(IMPERSONATION_COOKIE);
  jar.delete(IMPERSONATION_MODE_COOKIE);
}

export async function getActiveImpersonationSession(
  operatorUserId: string
): Promise<ImpersonationSessionView | null> {
  const jar = await cookies();
  const sessionId = jar.get(IMPERSONATION_COOKIE)?.value ?? null;
  if (!sessionId) return null;

  const client = await dbClient();
  const { data, error } = await client
    .from("platform_impersonation_sessions")
    .select("id, organization_id, target_role, mode, started_at, organizations(name)")
    .eq("id", sessionId)
    .eq("operator_user_id", operatorUserId)
    .is("ended_at", null)
    .maybeSingle();
  if (error || !data) return null;
  const targetRole = String(data["target_role"] ?? "");
  if (!isImpersonationTargetRole(targetRole)) return null;

  const orgRaw = data["organizations"];
  const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
  return {
    id: String(data["id"]),
    organizationId: String(data["organization_id"]),
    organizationName: (org as { name?: string } | null)?.name ?? "Organization",
    targetRole,
    mode: (data["mode"] as "read_only" | "write_enabled") ?? "read_only",
    startedAt: String(data["started_at"]),
    homeHref: IMPERSONATION_HOME_BY_ROLE[targetRole]
  };
}
