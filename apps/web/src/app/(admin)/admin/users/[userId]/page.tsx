import { Ma3UserDetailPage } from "../../../../components/admin/ma3-user-detail-page";
import { loadUserProfile } from "../../../../lib/admin/load-user-profile";
import { loadMa3AuditDirectory } from "../../../../lib/admin/load-ma3-audit";

export const dynamic = "force-dynamic";

export default async function Page({
  params
}: {
  params: Promise<{ userId: string }> | { userId: string };
}) {
  const { userId } = await Promise.resolve(params);
  const profile = await loadUserProfile(userId);
  if (!profile) {
    return (
      <main className="p-6">
        <h1 className="font-display text-2xl font-semibold">User not found</h1>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          No profile/membership data is available for this user id.
        </p>
      </main>
    );
  }

  const auditDir = await loadMa3AuditDirectory({
    actor: userId,
    range: "30d"
  });
  const related = auditDir.events.filter(
    (e) =>
      e.actorId === userId ||
      e.targetId === userId ||
      (typeof e.context["targetUserId"] === "string" && e.context["targetUserId"] === userId)
  );
  const security = related.filter((e) => e.source === "security");
  const audit = related.filter((e) => e.source !== "security");

  return <Ma3UserDetailPage profile={profile} audit={audit} security={security} />;
}
