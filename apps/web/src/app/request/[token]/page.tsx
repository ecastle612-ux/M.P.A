import { AuthChrome } from "../../../components/auth/auth-chrome";
import { PublicRequestPortal } from "../../../components/facility/public-request-portal";
import { createAuthServerClient } from "../../../lib/auth/server";

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
  return (
    <AuthChrome>
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <PublicRequestPortal token={token} via={via ?? null} signedIn={signedIn} />
      </div>
    </AuthChrome>
  );
}
