import { AuthChrome } from "../../../../components/auth/auth-chrome";
import { PublicPartnerRequestPortal } from "../../../../components/partners/public-partner-request-portal";
import { loadPartnerRequestDeps } from "../../../../lib/partners/request-deps";
import { resolveLivePropertyPortal } from "../../../../lib/partners/property-portal-service";
import { partnerPropertyUnitHint } from "@mpa/shared";

export default async function Page({
  params
}: {
  params: Promise<{ token: string; propertySlug: string }>;
}) {
  const { token, propertySlug } = await params;
  let live: Awaited<ReturnType<typeof resolveLivePropertyPortal>> = null;
  try {
    const deps = await loadPartnerRequestDeps();
    live = await resolveLivePropertyPortal(token, propertySlug, deps);
  } catch {
    live = null;
  }

  if (!live) {
    return (
      <AuthChrome>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h1 className="font-display text-2xl font-semibold">Request link unavailable</h1>
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
            This request link is not available.
          </p>
          <p className="mt-4 text-xs text-[var(--mpa-color-text-muted)]">Powered by M.P.A.</p>
        </div>
      </AuthChrome>
    );
  }

  return (
    <AuthChrome>
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <PublicPartnerRequestPortal
          slug={live.public.slug}
          branding={{
            ...live.public,
            unitHint: partnerPropertyUnitHint("complete")
          }}
          propertySlug={live.public.propertySlug}
          propertyName={live.public.propertyName}
          propertyInstructions={live.public.propertyInstructions}
        />
      </div>
    </AuthChrome>
  );
}
