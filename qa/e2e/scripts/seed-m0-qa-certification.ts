/**
 * M0-REG-003 — Production-safe QA certification fixtures.
 *
 * AUTH-001 Slice D: provisions organization_admin, leasing_agent, and
 * facility_technician as first-class membership roles (plus existing PM /
 * owner / tenant / vendor) and Master Admin via app_metadata.dev_master_admin.
 *
 * Requires: QA_E2E_ALLOW_PROD=true when targeting production Supabase.
 * Usage: QA_E2E_ALLOW_PROD=true pnpm --filter @mpa/qa-e2e exec tsx scripts/seed-m0-qa-certification.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ORG_NAME = "MPA QA Certification";
const ORG_SLUG = "mpa-qa-certification";
const EMAIL_DOMAIN = "qa.mpa.local";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function generatePassword(): string {
  return `QaM0-${randomBytes(12).toString("base64url")}!9`;
}

async function ensureUser(
  admin: SupabaseClient,
  email: string,
  password: string,
  appMetadata?: Record<string, unknown>
): Promise<string> {
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = listed?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      ...(appMetadata ? { app_metadata: { ...existing.app_metadata, ...appMetadata } } : {})
    });
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    ...(appMetadata ? { app_metadata: appMetadata } : {})
  });
  if (error || !data.user) {
    throw new Error(error?.message ?? `Could not create ${email}`);
  }
  return data.user.id;
}

async function upsertMembership(
  admin: SupabaseClient,
  organizationId: string,
  userId: string,
  roles: string[],
  options?: { isOwner?: boolean }
): Promise<void> {
  const { error } = await admin.from("organization_memberships").upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      roles,
      status: "active",
      ...(options?.isOwner ? { is_owner: true } : {})
    },
    { onConflict: "organization_id,user_id" }
  );
  if (error) throw new Error(error.message);
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (/prod|vahnmcrpnuggxkivynvo/i.test(url) && optionalEnv("QA_E2E_ALLOW_PROD") !== "true") {
    throw new Error("Refusing production seed without QA_E2E_ALLOW_PROD=true");
  }

  const admin = createClient(url, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const sharedPassword = optionalEnv("QA_E2E_DEFAULT_PASSWORD") ?? generatePassword();

  const accounts = {
    masterAdmin: {
      email: optionalEnv("QA_E2E_MASTER_ADMIN_EMAIL") ?? `qa-master-admin@${EMAIL_DOMAIN}`,
      password: optionalEnv("QA_E2E_MASTER_ADMIN_PASSWORD") ?? sharedPassword,
      roles: [] as string[],
      master: true
    },
    orgAdmin: {
      email: optionalEnv("QA_E2E_ORG_ADMIN_EMAIL") ?? `qa-org-admin@${EMAIL_DOMAIN}`,
      password: optionalEnv("QA_E2E_ORG_ADMIN_PASSWORD") ?? sharedPassword,
      roles: ["organization_admin"] as string[],
      master: false,
      isOwner: true
    },
    pm: {
      email: optionalEnv("QA_E2E_PM_EMAIL") ?? `qa-pm@${EMAIL_DOMAIN}`,
      password: optionalEnv("QA_E2E_PM_PASSWORD") ?? sharedPassword,
      roles: ["property_manager"] as string[],
      master: false
    },
    leasingAgent: {
      email: optionalEnv("QA_E2E_LEASING_EMAIL") ?? `qa-leasing@${EMAIL_DOMAIN}`,
      password: optionalEnv("QA_E2E_LEASING_PASSWORD") ?? sharedPassword,
      roles: ["leasing_agent"] as string[],
      master: false
    },
    facilityTech: {
      email: optionalEnv("QA_E2E_TECH_EMAIL") ?? `qa-facility-tech@${EMAIL_DOMAIN}`,
      password: optionalEnv("QA_E2E_TECH_PASSWORD") ?? sharedPassword,
      roles: ["facility_technician"] as string[],
      master: false
    },
    owner: {
      email: optionalEnv("QA_E2E_OWNER_EMAIL") ?? `qa-owner@${EMAIL_DOMAIN}`,
      password: optionalEnv("QA_E2E_OWNER_PASSWORD") ?? sharedPassword,
      roles: ["property_owner"] as string[],
      master: false
    },
    vendor: {
      email: optionalEnv("QA_E2E_VENDOR_EMAIL") ?? `qa-vendor@${EMAIL_DOMAIN}`,
      password: optionalEnv("QA_E2E_VENDOR_PASSWORD") ?? sharedPassword,
      roles: ["vendor"] as string[],
      master: false
    },
    tenant: {
      email: optionalEnv("QA_E2E_RESIDENT_EMAIL") ?? `qa-tenant@${EMAIL_DOMAIN}`,
      password: optionalEnv("QA_E2E_RESIDENT_PASSWORD") ?? sharedPassword,
      roles: ["tenant"] as string[],
      master: false
    }
  };

  const pmId = await ensureUser(admin, accounts.pm.email, accounts.pm.password);

  let organizationId: string;
  const { data: existingOrg } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", ORG_SLUG)
    .maybeSingle();

  if (existingOrg?.id) {
    organizationId = existingOrg.id;
  } else {
    const { data: created, error } = await admin
      .from("organizations")
      .insert({
        name: ORG_NAME,
        slug: ORG_SLUG,
        created_by: pmId
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message ?? "org create failed");
    organizationId = created.id;
  }

  const userIds: Record<string, string> = {};
  const displayNames: Record<string, string> = {
    masterAdmin: "QA Master Admin",
    orgAdmin: "QA Org Admin",
    pm: "QA Property Manager",
    leasingAgent: "QA Leasing Agent",
    facilityTech: "QA Facility Technician",
    owner: "QA Property Owner",
    vendor: "QA Vendor User",
    tenant: "QA Tenant User"
  };
  for (const [key, account] of Object.entries(accounts)) {
    const id = await ensureUser(
      admin,
      account.email,
      account.password,
      account.master ? { dev_master_admin: true, qa_certification: true } : { qa_certification: true }
    );
    userIds[key] = id;
    await upsertMembership(admin, organizationId, id, account.roles, {
      isOwner: "isOwner" in account ? Boolean(account.isOwner) : false
    });
    const { error: profileError } = await admin.from("user_profiles").upsert(
      {
        user_id: id,
        display_name: displayNames[key] ?? `QA ${key}`,
        contact_email: account.email
      },
      { onConflict: "user_id" }
    );
    if (profileError) throw new Error(`profile ${key}: ${profileError.message}`);
    console.log(`[M0-QA] ready ${key} → ${account.email}`);
  }

  // Minimal dataset (QA-labeled, no real payments / customer PII)
  // Partial unique index on (organization_id, lower(code)) — find-then-insert only.
  let propertyId: string;
  {
    const { data: found } = await admin
      .from("properties")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("code", "QA-PROP-001")
      .is("deleted_at", null)
      .maybeSingle();
    if (found?.id) {
      propertyId = found.id;
    } else {
      const { data: inserted, error } = await admin
        .from("properties")
        .insert({
          organization_id: organizationId,
          name: "QA Certification Property",
          code: "QA-PROP-001",
          property_type: "apartment",
          status: "active",
          description: "M0 QA certification baseline — not a customer property",
          address_line_1: "100 QA Certification Way",
          city: "Austin",
          state_region: "TX",
          postal_code: "78701",
          country_code: "US",
          ownership_entity_name: "MPA QA Certification",
          owner_contact_name: "QA Owner",
          owner_contact_email: accounts.owner.email,
          metadata: { qa_certification: true, exclude_from_analytics: true },
          created_by: pmId
        })
        .select("id")
        .single();
      if (error || !inserted) throw new Error(error?.message ?? "property create failed");
      propertyId = inserted.id;
    }
  }

  async function ensureUnit(unitNumber: string, occupancy: string): Promise<string> {
    const { data: existing } = await admin
      .from("units")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("property_id", propertyId!)
      .eq("unit_number", unitNumber)
      .maybeSingle();
    if (existing?.id) return existing.id;
    const { data, error } = await admin
      .from("units")
      .insert({
        organization_id: organizationId,
        property_id: propertyId,
        unit_number: unitNumber,
        unit_label: `QA Unit ${unitNumber}`,
        bedrooms: 2,
        bathrooms: 1,
        rent_amount: 1200,
        occupancy_status: occupancy,
        status: "active",
        metadata: { qa_certification: true },
        created_by: pmId
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "unit create failed");
    return data.id;
  }

  const unit1Id = await ensureUnit("101", "occupied");
  const unit2Id = await ensureUnit("102", "vacant_ready");

  async function ensureTenant(email: string, first: string, last: string, unitId: string | null, userId: string | null) {
    const { data: existing } = await admin
      .from("tenants")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", email)
      .maybeSingle();
    if (existing?.id) return existing.id;
    const { data, error } = await admin
      .from("tenants")
      .insert({
        organization_id: organizationId,
        property_id: propertyId,
        unit_id: unitId,
        first_name: first,
        last_name: last,
        email,
        status: "active",
        lifecycle_status: unitId ? "active" : "awaiting_move_in",
        user_id: userId,
        notes: "QA certification fixture — not a customer",
        metadata: { qa_certification: true, exclude_from_analytics: true },
        created_by: pmId
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "tenant create failed");
    return data.id;
  }

  const tenant1Id = await ensureTenant(accounts.tenant.email, "QA", "Tenant", unit1Id, userIds.tenant);
  await ensureTenant(`qa-tenant-2@${EMAIL_DOMAIN}`, "QA", "TenantTwo", null, null);

  // One active lease — required for SetupGate completion (portfolio lease count)
  {
    const { data: existing } = await admin
      .from("leases")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("lease_number", "QA-LEASE-001")
      .maybeSingle();
    if (!existing) {
      const { data: leaseRow, error } = await admin
        .from("leases")
        .insert({
          organization_id: organizationId,
          lease_number: "QA-LEASE-001",
          property_id: propertyId,
          unit_id: unit1Id,
          primary_tenant_id: tenant1Id,
          lease_type: "residential",
          status: "active",
          start_date: "2026-01-01",
          end_date: "2026-12-31",
          move_in_date: "2026-01-01",
          rent_amount: 1200,
          security_deposit: 1200,
          renewal_option: false,
          renewal_status: "none",
          internal_notes: "QA certification lease — not a customer agreement",
          metadata: { qa_certification: true, exclude_from_analytics: true },
          created_by: pmId,
          activated_at: new Date().toISOString()
        })
        .select("id")
        .single();
      if (error || !leaseRow) throw new Error(`lease: ${error?.message ?? "insert returned no row"}`);
    }
  }

  let vendorId: string;
  {
    const { data: existing } = await admin
      .from("vendors")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("business_name", "QA Certification Vendor")
      .maybeSingle();
    if (existing?.id) {
      vendorId = existing.id;
    } else {
      const { data, error } = await admin
        .from("vendors")
        .insert({
          organization_id: organizationId,
          business_name: "QA Certification Vendor",
          primary_contact_name: "QA Vendor Contact",
          email: accounts.vendor.email,
          phone: "555-0100",
          status: "active",
          services: ["general"],
          internal_notes: "QA certification fixture — never assign to customer jobs",
          metadata: { qa_certification: true, exclude_from_analytics: true },
          created_by: pmId
        })
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message ?? "vendor create failed");
      vendorId = data.id;
    }
  }

  let workOrderId: string;
  {
    const { data: existing } = await admin
      .from("maintenance_work_orders")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("work_order_number", "QA-WO-001")
      .maybeSingle();
    if (existing?.id) {
      workOrderId = existing.id;
    } else {
      const { data, error } = await admin
        .from("maintenance_work_orders")
        .insert({
          organization_id: organizationId,
          property_id: propertyId,
          unit_id: unit1Id,
          tenant_id: tenant1Id,
          vendor_id: vendorId,
          work_order_number: "QA-WO-001",
          title: "QA Certification Maintenance Request",
          description: "Synthetic QA work order — do not dispatch or invoice",
          category: "general",
          priority: "low",
          status: "submitted",
          metadata: { qa_certification: true, exclude_from_analytics: true, suppress_notifications: true },
          created_by: pmId
        })
        .select("id")
        .single();
      if (error || !data) throw new Error(error?.message ?? "work order create failed");
      workOrderId = data.id;
    }
  }

  // Vendor job token (hashed like production mint — no real payout)
  {
    const { data: existing } = await admin
      .from("vendor_work_order_tokens")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("work_order_id", workOrderId)
      .is("revoked_at", null)
      .maybeSingle();
    if (!existing) {
      const rawToken = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");
      const { error } = await admin.from("vendor_work_order_tokens").insert({
        organization_id: organizationId,
        work_order_id: workOrderId,
        vendor_id: vendorId,
        token_hash: tokenHash,
        token_prefix: rawToken.slice(0, 8),
        created_by: pmId,
        expires_at: null
      });
      if (error) throw new Error(`vendor token: ${error.message}`);
    }
  }

  // Document vault row (no binary required)
  {
    const { data: existing } = await admin
      .from("vault_documents")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("title", "QA Certification Document")
      .maybeSingle();
    if (!existing) {
      await admin.from("vault_documents").insert({
        organization_id: organizationId,
        entity_type: "property",
        entity_id: propertyId,
        document_type: "other",
        title: "QA Certification Document",
        notes: "QA baseline document placeholder",
        metadata: { qa_certification: true },
        created_by: pmId
      });
    }
  }

  // Message thread
  {
    const { data: existing } = await admin
      .from("conversation_threads")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("subject", "QA Certification Thread")
      .maybeSingle();
    if (!existing) {
      const { data: thread, error } = await admin
        .from("conversation_threads")
        .insert({
          organization_id: organizationId,
          thread_type: "resident_maintenance",
          source_entity_type: "maintenance",
          source_entity_id: workOrderId,
          property_id: propertyId,
          unit_id: unit1Id,
          subject: "QA Certification Thread",
          status: "active",
          metadata: { qa_certification: true, suppress_notifications: true },
          created_by: pmId
        })
        .select("id")
        .single();
      if (error || !thread) throw new Error(error?.message ?? "thread create failed");
      const { error: msgError } = await admin.from("communication_messages").insert({
        organization_id: organizationId,
        thread_id: thread.id,
        sender_id: pmId,
        body: "QA certification baseline message — do not notify customers.",
        visibility: "internal",
        delivery_status: "sent",
        metadata: { qa_certification: true, suppress_notifications: true },
        created_by: pmId
      });
      if (msgError) throw new Error(`message: ${msgError.message}`);
    }
  }

  // Owner statement / report baseline
  {
    const { data: existing } = await admin
      .from("owner_statements")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("statement_number", "QA-STMT-001")
      .maybeSingle();
    if (!existing) {
      await admin.from("owner_statements").insert({
        organization_id: organizationId,
        statement_number: "QA-STMT-001",
        property_id: propertyId,
        owner_placeholder: accounts.owner.email,
        statement_period_start: "2026-07-01",
        statement_period_end: "2026-07-31",
        status: "draft",
        total_income: 0,
        total_expenses: 0,
        net_income: 0,
        occupancy_rate: 50,
        maintenance_cost: 0,
        outstanding_balances: 0,
        metadata: { qa_certification: true, exclude_from_analytics: true },
        created_by: pmId
      });
    }
  }

  // Isolation control org (empty) — second org for cross-org denial checks
  const isoSlug = "mpa-qa-isolation";
  const { data: isoExisting } = await admin.from("organizations").select("id").eq("slug", isoSlug).maybeSingle();
  let isolationOrgId = isoExisting?.id as string | undefined;
  if (!isolationOrgId) {
    const { data, error } = await admin
      .from("organizations")
      .insert({
        name: "MPA QA Isolation Control",
        slug: isoSlug,
        created_by: pmId
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "isolation org failed");
    isolationOrgId = data.id;
  }
  // Only master admin on isolation org — PM must not see its data
  await upsertMembership(admin, isolationOrgId, userIds.masterAdmin!, []);

  const rootDir = path.dirname(fileURLToPath(import.meta.url));
  const envLocalPath = path.join(rootDir, "..", ".env.local");
  const q = (value: string) => JSON.stringify(value);
  const envBody = [
    "# M0-REG-003 QA certification fixtures - DO NOT COMMIT",
    "QA_E2E_AUTH_ENABLED=true",
    "QA_E2E_ALLOW_PROD=true",
    `PLAYWRIGHT_BASE_URL=${q(optionalEnv("PLAYWRIGHT_BASE_URL") ?? "https://www.my-property-assistant.com")}`,
    "PLAYWRIGHT_SKIP_WEBSERVER=1",
    `QA_E2E_MASTER_ADMIN_EMAIL=${q(accounts.masterAdmin.email)}`,
    `QA_E2E_MASTER_ADMIN_PASSWORD=${q(accounts.masterAdmin.password)}`,
    `QA_E2E_ORG_ADMIN_EMAIL=${q(accounts.orgAdmin.email)}`,
    `QA_E2E_ORG_ADMIN_PASSWORD=${q(accounts.orgAdmin.password)}`,
    `QA_E2E_PM_EMAIL=${q(accounts.pm.email)}`,
    `QA_E2E_PM_PASSWORD=${q(accounts.pm.password)}`,
    `QA_E2E_LEASING_EMAIL=${q(accounts.leasingAgent.email)}`,
    `QA_E2E_LEASING_PASSWORD=${q(accounts.leasingAgent.password)}`,
    `QA_E2E_TECH_EMAIL=${q(accounts.facilityTech.email)}`,
    `QA_E2E_TECH_PASSWORD=${q(accounts.facilityTech.password)}`,
    `QA_E2E_OWNER_EMAIL=${q(accounts.owner.email)}`,
    `QA_E2E_OWNER_PASSWORD=${q(accounts.owner.password)}`,
    `QA_E2E_VENDOR_EMAIL=${q(accounts.vendor.email)}`,
    `QA_E2E_VENDOR_PASSWORD=${q(accounts.vendor.password)}`,
    `QA_E2E_RESIDENT_EMAIL=${q(accounts.tenant.email)}`,
    `QA_E2E_RESIDENT_PASSWORD=${q(accounts.tenant.password)}`,
    `QA_E2E_ORG_ID=${q(organizationId)}`,
    `QA_E2E_ORG_NAME=${q(ORG_NAME)}`,
    `QA_E2E_ISOLATION_ORG_ID=${q(isolationOrgId!)}`,
    `QA_E2E_PROPERTY_ID=${q(propertyId)}`,
    `QA_E2E_WORK_ORDER_ID=${q(workOrderId)}`,
    ""
  ].join("\n");
  writeFileSync(envLocalPath, envBody, { mode: 0o600 });

  // AUTH-001 Slice D — property scopes for leasing / facility tech
  for (const key of ["leasingAgent", "facilityTech"] as const) {
    const uid = userIds[key];
    if (!uid) continue;
    const { data: membership } = await admin
      .from("organization_memberships")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", uid)
      .maybeSingle();
    if (!membership?.id) continue;
    await admin.from("membership_property_scopes").delete().eq("membership_id", membership.id);
    const { error: scopeError } = await admin.from("membership_property_scopes").insert({
      organization_id: organizationId,
      membership_id: membership.id,
      property_id: propertyId
    });
    if (scopeError) throw new Error(`scope ${key}: ${scopeError.message}`);
  }

  const summaryPath = path.join(
    rootDir,
    "../../../docs/106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-003/provision-summary.json"
  );
  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        organization: { id: organizationId, name: ORG_NAME, slug: ORG_SLUG },
        isolationOrganizationId: isolationOrgId,
        propertyId,
        unitIds: [unit1Id, unit2Id],
        vendorId,
        workOrderId,
        emails: Object.fromEntries(Object.entries(accounts).map(([k, v]) => [k, v.email])),
        sliceDRoles: ["organization_admin", "leasing_agent", "facility_technician"],
        credentialsFile: "qa/e2e/.env.local (gitignored)"
      },
      null,
      2
    )
  );

  console.log("[M0-QA] Organization:", ORG_NAME, organizationId);
  console.log("[M0-QA] Credentials written to qa/e2e/.env.local (not printed)");
  console.log("[M0-QA] Summary:", summaryPath);
  console.log(
    "[M0-QA] Slice D roles provisioned: organization_admin, leasing_agent, facility_technician"
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
