import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinanceCapability } from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import { getActiveOrganizationIdFromCookie } from "../organization/server";

export async function requireFinancePermission(capability: FinanceCapability, organizationId?: string) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const orgId = organizationId ?? (await getActiveOrganizationIdFromCookie());
  if (!orgId) {
    return { error: NextResponse.json({ error: "Organization required" }, { status: 400 }) };
  }

  const authorizationContext = await resolveAuthorizationContext(user, orgId);
  if (!evaluatePermission(authorizationContext, capability)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  // Finance tables are ahead of generated Database typings.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { supabase: supabase as SupabaseClient<any>, user, organizationId: orgId };
}

export type FinanceAuthz = Exclude<Awaited<ReturnType<typeof requireFinancePermission>>, { error: NextResponse }>;
