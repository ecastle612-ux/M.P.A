import { UserProfilePage } from "../../../../../../components/admin/user-profile-page";
import { loadUserProfile } from "../../../../../../lib/admin/load-user-profile";

export const dynamic = "force-dynamic";

export default async function AdminCustomerProfileRoute({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const profile = await loadUserProfile(userId);
  if (!profile) {
    return (
      <main className="p-6">
        <h1 className="font-display text-2xl font-semibold">User not found</h1>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          No profile data is available for this user id. This is an intentional support empty state —
          not a broken route.
        </p>
      </main>
    );
  }
  return <UserProfilePage profile={profile} />;
}
