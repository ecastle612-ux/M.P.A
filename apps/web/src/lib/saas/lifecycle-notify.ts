/**
 * BILL-001 Phase C — notify org billing admins when SaaS subscription entitlements change.
 */
import { insertInAppNotificationRow } from "../notifications/server";
import { createServiceRoleServerClient } from "../auth/server";
import type { SaasPlanCode, SaasSubscriptionStatus } from "../integrations/saas-billing/contracts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(client?: AnyClient): AnyClient | null {
  if (client) return client;
  return createServiceRoleServerClient();
}

export async function notifySubscriptionEntitlementChange(input: {
  organizationId: string;
  planCode: SaasPlanCode;
  status: SaasSubscriptionStatus | string;
  eventType: "upsert" | "deleted" | "checkout";
  subscriptionId?: string | null;
  client?: AnyClient;
}): Promise<void> {
  const db = serviceClient(input.client);
  if (!db) return;

  try {
    const { data: members } = await db
      .from("organization_memberships")
      .select("user_id, roles")
      .eq("organization_id", input.organizationId)
      .eq("status", "active")
      .limit(50);

    const recipients = ((members ?? []) as Array<{ user_id: string; roles: unknown }>).filter(
      (row) => {
        const roles = Array.isArray(row.roles) ? row.roles.map(String) : [];
        return roles.some((role) =>
          ["property_manager", "organization_admin", "owner"].includes(role)
        );
      }
    );

    if (!recipients.length) return;

    const title =
      input.eventType === "deleted"
        ? "Subscription canceled"
        : input.eventType === "checkout"
          ? "Subscription activated"
          : "Subscription updated";
    const body =
      input.eventType === "deleted"
        ? `Your M.P.A. subscription is canceled. New properties and team seats are blocked until you resubscribe.`
        : `Plan ${input.planCode} is now ${input.status}. Entitlements were refreshed for this organization.`;

    await Promise.all(
      recipients.slice(0, 20).map((member) =>
        insertInAppNotificationRow(
          input.organizationId,
          null,
          {
            userId: member.user_id,
            category: "system",
            priority: input.status === "past_due" || input.eventType === "deleted" ? "high" : "normal",
            title,
            body,
            href: "/settings/billing",
            sourceEntityType: "saas_subscription",
            sourceEntityId: input.subscriptionId ?? null,
            metadata: {
              planCode: input.planCode,
              status: input.status,
              eventType: input.eventType
            },
            idempotencyKey: `saas-entitlement:${input.organizationId}:${input.eventType}:${input.planCode}:${input.status}:${input.subscriptionId ?? "none"}`
          },
          db
        ).catch(() => null)
      )
    );
  } catch {
    // Best-effort; audit ledger remains SoT.
  }
}
