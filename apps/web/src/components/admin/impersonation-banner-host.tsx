import { cookies } from "next/headers";
import { IMPERSONATION_COOKIE } from "@mpa/shared";
import { ImpersonationBanner } from "./impersonation-banner";
import { getActiveImpersonationSession } from "../../lib/admin/impersonation-service";
import { createAuthServerClient } from "../../lib/auth/server";
import { isPlatformOperatorUser } from "../../lib/commercial/server";

/** Server component — shows View As banner when an operator support session is active. */
export async function ImpersonationBannerHost() {
  const jar = await cookies();
  if (!jar.get(IMPERSONATION_COOKIE)?.value) return null;

  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (!(await isPlatformOperatorUser(user))) return null;

  const session = await getActiveImpersonationSession(user.id);
  if (!session) return null;

  return (
    <ImpersonationBanner
      organizationName={session.organizationName}
      targetRole={session.targetRole}
      mode={session.mode}
    />
  );
}
