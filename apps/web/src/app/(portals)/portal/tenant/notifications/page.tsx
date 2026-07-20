import { redirect } from "next/navigation";
import { Card } from "@mpa/ui";
import { AppPage } from "../../../../../components/presentation/app-page";
import { createAuthServerComponentClient } from "../../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/server";
import { getNotificationsForUser } from "../../../../../lib/notifications/server";

export default async function TenantNotificationsPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/portal/tenant");

  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "notification:read")) redirect("/unauthorized");

  const summary = await getNotificationsForUser(organizationId, user.id, { limit: 40 }, supabase);
  const notifications = summary.items;

  return (
    <AppPage
      breadcrumbs={[
        { href: "/portal/tenant", label: "Tenant home" },
        { label: "Notifications" }
      ]}
    >
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--mpa-color-text-primary)]">Notifications</h1>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Recent alerts about payments, maintenance, and messages.
          </p>
        </div>

        {notifications.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">You are all caught up.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card key={notification.id} className="space-y-1">
                <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{notification.title}</p>
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">{notification.body}</p>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {new Date(notification.createdAt).toLocaleString()}
                  {notification.href ? (
                    <>
                      {" · "}
                      <a className="underline" href={notification.href}>
                        Open
                      </a>
                    </>
                  ) : null}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppPage>
  );
}
