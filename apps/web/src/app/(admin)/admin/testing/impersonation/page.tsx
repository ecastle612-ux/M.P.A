import { redirect } from "next/navigation";

/** Legacy View As URL — keep bookmarks working (PRA-009). */
export default async function LegacyImpersonationRedirect({
  searchParams
}: {
  searchParams: Promise<{ orgId?: string }>;
}) {
  const params = await searchParams;
  const orgId = params.orgId?.trim();
  redirect(orgId ? `/admin/support/view-as?orgId=${encodeURIComponent(orgId)}` : "/admin/support/view-as");
}
