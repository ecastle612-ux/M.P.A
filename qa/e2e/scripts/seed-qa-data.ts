/**
 * QA-001 seed script — creates isolated qa-* organizations and role users.
 * Never targets production. Requires service role against a non-prod project.
 *
 * Usage: pnpm --filter @mpa/qa-e2e seed
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { qaOrgName, qaRunId } from "../src/utils/env";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

async function ensureUser(admin: SupabaseClient, email: string, password: string): Promise<string> {
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = listed?.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (error || !data.user) {
    throw new Error(error?.message ?? `Could not create ${email}`);
  }
  return data.user.id;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (/prod/i.test(url) && optionalEnv("QA_E2E_ALLOW_PROD") !== "true") {
    throw new Error("Refusing to seed against a production-looking Supabase URL");
  }

  const admin = createClient(url, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const runId = qaRunId();
  const orgName = qaOrgName("org");
  const password = optionalEnv("QA_E2E_DEFAULT_PASSWORD") ?? `Qa-${runId}-Pass!9`;

  const pmEmail = optionalEnv("QA_E2E_PM_EMAIL") || `qa-pm-${runId}@example.com`;
  const pmPassword = optionalEnv("QA_E2E_PM_PASSWORD") || password;
  const pmId = await ensureUser(admin, pmEmail, pmPassword);

  const users = [
    {
      email: optionalEnv("QA_E2E_MASTER_ADMIN_EMAIL") || `qa-master-${runId}@example.com`,
      password: optionalEnv("QA_E2E_MASTER_ADMIN_PASSWORD") || password,
      roles: ["property_manager"] as string[]
    },
    {
      email: pmEmail,
      password: pmPassword,
      roles: ["property_manager"]
    },
    {
      email: optionalEnv("QA_E2E_RESIDENT_EMAIL") || `qa-resident-${runId}@example.com`,
      password: optionalEnv("QA_E2E_RESIDENT_PASSWORD") || password,
      roles: ["tenant"]
    },
    {
      email: optionalEnv("QA_E2E_VENDOR_EMAIL") || `qa-vendor-${runId}@example.com`,
      password: optionalEnv("QA_E2E_VENDOR_PASSWORD") || password,
      roles: ["vendor"]
    },
    {
      email: optionalEnv("QA_E2E_OWNER_EMAIL") || `qa-owner-${runId}@example.com`,
      password: optionalEnv("QA_E2E_OWNER_PASSWORD") || password,
      roles: ["property_owner"]
    }
  ];

  const slug = `qa-${runId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 48);
  const { data: created, error } = await admin
    .from("organizations")
    .insert({
      name: orgName,
      slug,
      created_by: pmId
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? "Could not create QA organization");
  }

  for (const user of users) {
    const userId = await ensureUser(admin, user.email, user.password);
    const { error: membershipError } = await admin.from("organization_memberships").upsert(
      {
        organization_id: created.id,
        user_id: userId,
        roles: user.roles,
        status: "active"
      },
      { onConflict: "organization_id,user_id" }
    );
    if (membershipError) {
      throw new Error(membershipError.message);
    }
    console.log(`[QA-001 seed] User ready: ${user.email}`);
  }

  console.log("[QA-001 seed] Complete.");
  console.log("Set QA_E2E_AUTH_ENABLED=true and role password env vars before running authenticated suites.");
  console.log(`Isolated org: ${orgName} (${created.id})`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
