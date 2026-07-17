import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createAuthServerComponentClient } from "../../../lib/auth/server";
import { QrEnrollmentPanel, type QrEnrollmentProperty } from "../../../components/communication/qr-enrollment-panel";

type QrResolveResponse = {
  property: QrEnrollmentProperty;
  organizationName?: string | null;
};

async function fetchQrProperty(token: string): Promise<QrResolveResponse | null> {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  try {
    const response = await fetch(`${protocol}://${host}/api/communication/qr/${token}`, {
      cache: "no-store"
    });
    if (!response.ok) return null;
    return (await response.json()) as QrResolveResponse;
  } catch {
    return null;
  }
}

export default async function JoinPropertyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resolved = await fetchQrProperty(token);
  if (!resolved?.property) {
    notFound();
  }

  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <main className="mpa-page flex min-h-screen flex-1 items-center justify-center p-6">
      <QrEnrollmentPanel
        token={token}
        property={resolved.property}
        organizationName={resolved.organizationName ?? null}
        isAuthenticated={Boolean(user)}
      />
    </main>
  );
}
