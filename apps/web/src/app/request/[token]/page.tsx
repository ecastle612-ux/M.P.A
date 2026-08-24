import { AuthChrome } from "../../../components/auth/auth-chrome";
import { PublicRequestPortal } from "../../../components/facility/public-request-portal";
import { PublicPartnerRequestPortal } from "../../../components/partners/public-partner-request-portal";
import { createAuthServerClient } from "../../../lib/auth/server";
import { loadPartnerRequestDeps } from "../../../lib/partners/request-deps";
import { resolveLivePartnerPortal } from "../../../lib/partners/request-service";

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ via?: string }>;
}) {
  const { token } = await params;
  const { via } = await searchParams;
  let signedIn = false;
  try {
    const auth = await createAuthServerClient();
    const {
      data: { user }
    } = await auth.auth.getUser();
    signedIn = Boolean(user);
  } catch {
    signedIn = false;
  }

  let partnerPortal: Awaited<ReturnType<typeof resolveLivePartnerPortal>> = null;
  try {
    const deps = await loadPartnerRequestDeps();
    partnerPortal = await resolveLivePartnerPortal(token, deps);
  } catch {
    partnerPortal = null;
  }

  if (partnerPortal) {
    return (
      <AuthChrome>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <PublicPartnerRequestPortal slug={partnerPortal.public.slug} branding={partnerPortal.public} />
        </div>
      </AuthChrome>
    );
  }

  return (
    <AuthChrome>
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <PublicRequestPortal token={token} via={via ?? null} signedIn={signedIn} />
      </div>
    </AuthChrome>
  );
}
