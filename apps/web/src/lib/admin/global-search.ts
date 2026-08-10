import { createAuthServerClient } from "../auth/server";
import { serverEnv } from "../env/server-env";

export type GlobalSearchHit = {
  id: string;
  kind: string;
  title: string;
  detail: string;
  href: string;
};

type AnyClient = { from: (table: string) => any };

async function tryServiceRole(): Promise<AnyClient | null> {
  try {
    if (process.env["VITEST"]) return null;
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../supabase/service-role");
    return createServiceRoleClient() as unknown as AnyClient;
  } catch {
    return null;
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function safeQuery<T extends Record<string, unknown>>(
  fn: () => Promise<{ data: T[] | null }>
): Promise<T[]> {
  try {
    const { data } = await fn();
    return (data ?? []) as T[];
  } catch {
    return [];
  }
}

export async function runGlobalOwnerSearch(query: string, limit = 40): Promise<GlobalSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const like = `%${q}%`;
  const isUuid = UUID_RE.test(q);

  const service = await tryServiceRole();
  const supabase = (service ?? ((await createAuthServerClient()) as unknown as AnyClient)) as AnyClient;
  const hits: GlobalSearchHit[] = [];

  const [orgs, invites, properties, residents, docs, purchases, residentsByEmail] = await Promise.all([
    safeQuery<{ id: string; name: string; slug?: string }>(() =>
      isUuid
        ? supabase.from("organizations").select("id, name, slug").eq("id", q).limit(5)
        : supabase.from("organizations").select("id, name, slug").ilike("name", like).limit(10)
    ),
    safeQuery<{
      id: string;
      email: string;
      organization_id: string;
      status: string;
      organizations: { name?: string } | Array<{ name?: string }> | null;
    }>(() =>
      supabase
        .from("organization_invitations")
        .select("id, email, organization_id, status, organizations(name)")
        .ilike("email", like)
        .limit(10)
    ),
    safeQuery<{ id: string; name: string; organization_id: string }>(() =>
      supabase.from("property_properties").select("id, name, organization_id").ilike("name", like).limit(10)
    ),
    safeQuery<{
      id: string;
      display_name: string;
      email: string | null;
      organization_id: string;
      status: string;
    }>(() =>
      supabase
        .from("pm_residents")
        .select("id, display_name, email, organization_id, status")
        .ilike("display_name", like)
        .limit(10)
    ),
    safeQuery<{ id: string; title: string; organization_id: string; entity_type: string }>(() =>
      supabase
        .from("document_documents")
        .select("id, title, organization_id, entity_type")
        .ilike("title", like)
        .limit(10)
    ),
    safeQuery<{
      stripe_checkout_session_id: string;
      customer_email: string | null;
      organization_id: string | null;
      status: string;
    }>(() =>
      supabase
        .from("saas_checkout_sessions")
        .select("stripe_checkout_session_id, customer_email, organization_id, status")
        .ilike("customer_email", like)
        .limit(10)
    ),
    safeQuery<{
      id: string;
      display_name: string;
      email: string | null;
      organization_id: string;
      status: string;
    }>(() =>
      supabase
        .from("pm_residents")
        .select("id, display_name, email, organization_id, status")
        .ilike("email", like)
        .limit(10)
    )
  ]);

  if (isUuid) {
    const members = await safeQuery<{
      id: string;
      user_id: string;
      organization_id: string;
      roles: string[] | null;
      organizations: { name?: string } | Array<{ name?: string }> | null;
    }>(() =>
      supabase
        .from("organization_memberships")
        .select("id, user_id, organization_id, roles, organizations(name)")
        .eq("user_id", q)
        .limit(10)
    );
    for (const row of members) {
      const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
      hits.push({
        id: `user-${row.user_id}`,
        kind: "user",
        title: `User ${String(row.user_id).slice(0, 8)}…`,
        detail: `${org?.name ?? "Organization"} · ${(row.roles ?? []).join(", ")}`,
        href: `/admin/platform/customers/${row.user_id}`
      });
    }
  }

  for (const org of orgs) {
    hits.push({
      id: `org-${org.id}`,
      kind: "organization",
      title: org.name,
      detail: `Slug ${org.slug ?? "—"}`,
      href: `/admin/platform/organizations/${org.id}`
    });
  }
  for (const inv of invites) {
    const org = Array.isArray(inv.organizations) ? inv.organizations[0] : inv.organizations;
    hits.push({
      id: `inv-${inv.id}`,
      kind: "invitation",
      title: inv.email,
      detail: `Invitation · ${org?.name ?? "Org"} · ${inv.status}`,
      href: `/admin/support?q=${encodeURIComponent(inv.email)}`
    });
  }
  for (const prop of properties) {
    hits.push({
      id: `prop-${prop.id}`,
      kind: "property",
      title: prop.name,
      detail: "Property",
      href: `/admin/platform/organizations/${prop.organization_id}`
    });
  }
  for (const resident of [...residents, ...residentsByEmail]) {
    hits.push({
      id: `res-${resident.id}`,
      kind: "resident",
      title: resident.display_name,
      detail: `${resident.email} · ${resident.status}`,
      href: `/admin/platform/organizations/${resident.organization_id}`
    });
  }
  for (const doc of docs) {
    hits.push({
      id: `doc-${doc.id}`,
      kind: "document",
      title: doc.title,
      detail: String(doc.entity_type),
      href: `/admin/platform/organizations/${doc.organization_id}`
    });
  }
  for (const purchase of purchases) {
    hits.push({
      id: `pay-${purchase.stripe_checkout_session_id}`,
      kind: "subscription",
      title: purchase.customer_email ?? "Checkout",
      detail: `Checkout ${purchase.status}`,
      href: purchase.organization_id
        ? `/admin/platform/organizations/${purchase.organization_id}`
        : "/admin/commercial/billing"
    });
  }

  const seen = new Set<string>();
  return hits
    .filter((h) => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    })
    .slice(0, limit);
}
