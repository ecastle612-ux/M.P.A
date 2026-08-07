import { Suspense } from "react";
import { SiteProfilePage } from "../../../../../components/facility/site-profile-page";

type Params = { params: Promise<{ siteId: string }> };

export default async function Page({ params }: Params) {
  const { siteId } = await params;
  return (
    <Suspense fallback={<main className="flex-1 p-6">Loading site profile…</main>}>
      <SiteProfilePage siteId={siteId} />
    </Suspense>
  );
}
