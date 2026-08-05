import { redirect } from "next/navigation";
import { AppPage } from "../../../../components/presentation/app-page";
import {
  type TenantAttentionItem,
  type TenantTodayCard
} from "../../../../components/portal/tenant-portal-home";
import { RoleUniversalDashboard } from "../../../../components/dashboard-framework/role-universal-dashboard";
import { buildResidentDashboardViewModel } from "../../../../lib/dashboard/ux016-role-builders";
import { getTimeGreeting } from "../../../../lib/format/display-labels";
import { MasterAdminPortalDemoPanel } from "../../../../components/master-admin/master-admin-portal-demo-panel";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { resolveLinkedTenantForUser } from "../../../../lib/resident/resolve-tenant";
import { getActiveMasterAdminSession } from "../../../../lib/master-admin/session";
import { getResidentAnnouncementsForUser } from "../../../../lib/communication/server";
import { getNotificationsForUser } from "../../../../lib/notifications/server";
import { getThreadsForOrganization } from "../../../../lib/messaging/server";
import { getResidentPaymentDashboard } from "../../../../lib/billing/server";
import { getWorkOrdersForOrganization } from "../../../../lib/maintenance/server";
import { toMaintenanceStatusLabel } from "../../../../lib/maintenance/contracts";
import { getTenantForOrganization } from "../../../../lib/tenant/server";

function firstNameFrom(displayName: string, fallbackFirst: string): string {
  const fromDisplay = displayName.trim().split(/\s+/)[0];
  if (fromDisplay) return fromDisplay;
  return fallbackFirst.trim() || "there";
}

function isWithinDays(iso: string | null | undefined, days: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  const delta = t - Date.now();
  return delta >= -1000 * 60 * 60 * 24 && delta <= 1000 * 60 * 60 * 24 * days;
}

/** Critical → Unread → Time-sensitive → Everything else (newest within band). */
function sortAttention(items: TenantAttentionItem[]): TenantAttentionItem[] {
  return [...items].sort((a, b) => {
    if (a.critical !== b.critical) return a.critical ? -1 : 1;
    if (a.unread !== b.unread) return a.unread ? -1 : 1;
    if (a.timeSensitive !== b.timeSensitive) return a.timeSensitive ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export default async function TenantPortalPage() {
  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const organizationId = await resolveActiveOrganizationIdForUser(user.id);
  if (!organizationId) redirect("/dashboard");

  const session = await getActiveMasterAdminSession(user.id);
  const inPortalTest = session?.mode === "portal_test" && session.portal === "resident";

  const authorization = await resolveAuthorizationContext(user, organizationId);
  const tenant = await resolveLinkedTenantForUser(organizationId, user.id, user.email, supabase);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const displayName =
    (profile?.display_name as string | null | undefined)?.trim() ||
    (tenant ? `${tenant.firstName} ${tenant.lastName}`.trim() : "");
  const firstName = firstNameFrom(displayName, tenant?.firstName ?? "");

  const canReadAnnouncements = evaluatePermission(authorization, "communication:read");
  const canReadNotifications = evaluatePermission(authorization, "notification:read");
  const canReadMessages = evaluatePermission(authorization, "message:read");
  const canReadMaintenance = evaluatePermission(authorization, "maintenance:read");

  const tenantDetail = tenant
    ? await getTenantForOrganization(organizationId, tenant.id, supabase)
    : null;

  const [announcements, notifications, threads, payments, openWorkOrders] = await Promise.all([
    canReadAnnouncements
      ? getResidentAnnouncementsForUser(organizationId, user.id, supabase)
      : Promise.resolve([]),
    canReadNotifications
      ? getNotificationsForUser(organizationId, user.id, { limit: 20 }, supabase)
      : Promise.resolve({ unreadCount: 0, items: [] }),
    canReadMessages
      ? getThreadsForOrganization(organizationId, user.id, { limit: 20 }, supabase)
      : Promise.resolve([]),
    tenant
      ? getResidentPaymentDashboard(organizationId, tenant.id, supabase).catch(() => null)
      : Promise.resolve(null),
    tenant && canReadMaintenance
      ? getWorkOrdersForOrganization(
          organizationId,
          { tenantId: tenant.id, status: "open", limit: 20 },
          supabase
        )
      : Promise.resolve([])
  ]);

  const attentionRaw: TenantAttentionItem[] = [];

  for (const item of announcements.slice(0, 12)) {
    const timeSensitive =
      item.priority === "high" ||
      isWithinDays(item.expiresAt, 3) ||
      isWithinDays(item.publishedAt ?? item.createdAt, 2);
    attentionRaw.push({
      id: `announcement-${item.id}`,
      title: item.title,
      body: item.message,
      href: `/portal/tenant/announcements/${item.id}`,
      critical: item.priority === "emergency",
      unread: !item.isRead,
      timeSensitive: timeSensitive && item.priority !== "emergency",
      createdAt: item.publishedAt ?? item.createdAt,
      kind: "announcement"
    });
  }

  for (const item of notifications.items.slice(0, 12)) {
    const category = item.category?.toLowerCase?.() ?? "";
    const timeSensitive =
      category.includes("payment") ||
      category.includes("rent") ||
      category.includes("lease") ||
      category.includes("maintenance") ||
      item.priority === "high";
    attentionRaw.push({
      id: `notification-${item.id}`,
      title: item.title,
      body: item.body,
      href: item.href?.trim() || "/portal/tenant/notifications",
      critical: item.priority === "emergency",
      unread: !item.readAt,
      timeSensitive: timeSensitive && item.priority !== "emergency",
      createdAt: item.createdAt,
      kind: "notification"
    });
  }

  for (const thread of threads) {
    const unread = (thread.unreadCount ?? 0) > 0;
    if (!unread && !thread.lastMessagePreview) continue;
    attentionRaw.push({
      id: `message-${thread.id}`,
      title: thread.subject?.trim() || "Message",
      body: thread.lastMessagePreview ?? "",
      href: `/portal/tenant/messages?thread=${encodeURIComponent(thread.id)}`,
      critical: false,
      unread,
      timeSensitive: unread,
      createdAt: thread.lastMessageAt ?? thread.updatedAt ?? thread.createdAt,
      kind: "message"
    });
  }

  const attentionItems = sortAttention(attentionRaw).slice(0, 5);

  const todayCards: TenantTodayCard[] = [];

  if (payments && payments.balanceDue > 0) {
    todayCards.push({
      id: "rent-due",
      title: "Rent due",
      description: `$${payments.balanceDue.toFixed(2)} ready when you are.`,
      href: "/portal/tenant/payments"
    });
  } else if (payments?.alerts?.length) {
    todayCards.push({
      id: "rent-alert",
      title: "Rent update",
      description: payments.alerts[0] ?? "Take a quick look at your rent account.",
      href: "/portal/tenant/payments"
    });
  }

  if (openWorkOrders.length > 0) {
    const first = openWorkOrders[0];
    todayCards.push({
      id: "open-maintenance",
      title: openWorkOrders.length === 1 ? "Maintenance in progress" : "Open maintenance",
      description: first
        ? `${first.title} · ${toMaintenanceStatusLabel(first.status)}`
        : "See the latest status.",
      href: first ? `/portal/tenant/maintenance/${first.id}` : "/portal/tenant/maintenance"
    });
  }

  const unreadThreads = threads.filter((t) => (t.unreadCount ?? 0) > 0);
  if (unreadThreads.length > 0) {
    todayCards.push({
      id: "recent-messages",
      title: unreadThreads.length === 1 ? "New message" : `${unreadThreads.length} new messages`,
      description: unreadThreads[0]?.lastMessagePreview || "Open Messages to catch up.",
      href: "/portal/tenant/messages"
    });
  }

  if (tenantDetail?.moveOutDate) {
    const moveOut = tenantDetail.moveOutDate;
    const soon = isWithinDays(moveOut, 60);
    if (
      soon ||
      tenantDetail.lifecycleStatus === "moving_out" ||
      tenantDetail.lifecycleStatus === "notice_given"
    ) {
      todayCards.push({
        id: "move-out",
        title: "Move-out coming up",
        description: `Marked for ${moveOut}. Documents and messages are here if you need them.`,
        href: "/portal/tenant/documents"
      });
    }
  }

  const model = buildResidentDashboardViewModel({
    timeGreeting: getTimeGreeting(),
    firstName,
    propertyName: tenantDetail?.propertyName ?? null,
    unitNumber: tenantDetail?.unitNumber ?? null,
    dateLabel: new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(new Date()),
    hasLinkedTenant: Boolean(tenant),
    attentionItems,
    todayCards
  });

  return (
    <AppPage>
      {inPortalTest && !tenant ? <MasterAdminPortalDemoPanel portal="resident" /> : null}
      <RoleUniversalDashboard model={model} />
    </AppPage>
  );
}
