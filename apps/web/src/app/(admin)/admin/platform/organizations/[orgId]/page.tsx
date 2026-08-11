import { notFound } from "next/navigation";
import { Ma2OrganizationDetailPage } from "../../../../../../components/admin/ma2-organization-detail-page";
import { loadMa2OrganizationDetail } from "../../../../../../lib/admin/load-ma2-org-detail";

type PageProps = {
  params: Promise<{ orgId: string }> | { orgId: string };
};

export default async function Page({ params }: PageProps) {
  const { orgId } = await Promise.resolve(params);
  // Server-validated organization id from path only.
  const detail = await loadMa2OrganizationDetail(orgId);
  if (!detail) notFound();
  return <Ma2OrganizationDetailPage detail={detail} />;
}
