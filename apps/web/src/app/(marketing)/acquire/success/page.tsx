import type { Metadata } from "next";
import { MarketingShell } from "../../../../components/acquire/marketing-shell";
import { AcquireSuccessPanel } from "../../../../components/acquire/acquire-success-panel";

export const metadata: Metadata = {
  title: "Checkout success",
  description: "Your M.P.A. Checkout completed. Workspace provisioning in progress.",
  robots: { index: false, follow: false }
};

export default async function AcquireSuccessPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sessionId = typeof params["session_id"] === "string" ? params["session_id"] : null;

  return (
    <MarketingShell>
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <AcquireSuccessPanel sessionId={sessionId} />
      </div>
    </MarketingShell>
  );
}
