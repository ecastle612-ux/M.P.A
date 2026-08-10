import { notFound } from "next/navigation";
import { OrganizationProfilePage } from "../../../../../../components/admin/organization-profile-page";
import { loadOrganizationProfile } from "../../../../../../lib/admin/load-org-profile";

type PageProps = { params: Promise<{ orgId: string }> };

export default async function Page({ params }: PageProps) {
  const { orgId } = await params;
  const profile = await loadOrganizationProfile(orgId);
  if (!profile) notFound();
  return <OrganizationProfilePage profile={profile} />;
}
