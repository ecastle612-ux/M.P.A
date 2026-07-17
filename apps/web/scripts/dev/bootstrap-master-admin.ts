import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  DEV_MASTER_ADMIN_APP_METADATA_FLAG,
  DEV_MASTER_ADMIN_DISPLAY_NAME,
  DEV_MASTER_ADMIN_EMAIL,
  DEV_MASTER_ADMIN_FIRST_NAME,
  DEV_MASTER_ADMIN_JOB_TITLE,
  DEV_MASTER_ADMIN_LAST_NAME,
  DEV_MASTER_ADMIN_MEMBERSHIP_ROLES,
  DEV_MASTER_ADMIN_ORG_NAME,
  DEV_MASTER_ADMIN_ORG_SLUG,
  DEV_MASTER_ADMIN_ROLE_LABEL,
  isDevEnvironment
} from "@mpa/shared";
import type { Database } from "@mpa/supabase";
import { isOrganizationPortfolioEmpty, seedDemoPortfolio } from "./seed-demo-portfolio";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

function loadEnvFiles() {
  const envFiles = [".env.local", ".env"];
  for (const fileName of envFiles) {
    const filePath = resolve(process.cwd(), fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    const content = readFileSync(filePath, "utf8");
    for (const rawLine of content.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createServiceRoleClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function findUserByEmail(client: ServiceClient, email: string) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message);
    }

    const matchedUser = data.users.find(
      (user) => user.email?.trim().toLowerCase() === email.trim().toLowerCase()
    );
    if (matchedUser) {
      return matchedUser;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthUser(client: ServiceClient) {
  const existingUser = await findUserByEmail(client, DEV_MASTER_ADMIN_EMAIL);
  const appMetadata = {
    ...(existingUser?.app_metadata ?? {}),
    [DEV_MASTER_ADMIN_APP_METADATA_FLAG]: true,
    role_label: DEV_MASTER_ADMIN_ROLE_LABEL,
    roles: [...DEV_MASTER_ADMIN_MEMBERSHIP_ROLES]
  };

  if (existingUser) {
    const { data, error } = await client.auth.admin.updateUserById(existingUser.id, {
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        first_name: DEV_MASTER_ADMIN_FIRST_NAME,
        last_name: DEV_MASTER_ADMIN_LAST_NAME
      },
      app_metadata: appMetadata
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      user: data.user,
      created: false
    };
  }

  const password = process.env["DEV_MASTER_ADMIN_PASSWORD"]?.trim();
  if (!password) {
    throw new Error(
      "DEV_MASTER_ADMIN_PASSWORD is required to create the development master administrator account."
    );
  }

  const { data, error } = await client.auth.admin.createUser({
    email: DEV_MASTER_ADMIN_EMAIL,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: DEV_MASTER_ADMIN_FIRST_NAME,
      last_name: DEV_MASTER_ADMIN_LAST_NAME
    },
    app_metadata: appMetadata
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    user: data.user,
    created: true
  };
}

async function upsertProfileAndPreferences(client: ServiceClient, userId: string) {
  const notificationPreferences = {
    email: true,
    in_app: true,
    sms: false,
    job_title: DEV_MASTER_ADMIN_JOB_TITLE
  };

  const { error: profileError } = await client.from("user_profiles").upsert(
    {
      user_id: userId,
      display_name: DEV_MASTER_ADMIN_DISPLAY_NAME,
      contact_email: DEV_MASTER_ADMIN_EMAIL
    },
    { onConflict: "user_id" }
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: preferencesError } = await client.from("user_preferences").upsert(
    {
      user_id: userId,
      timezone: "America/Chicago",
      notification_preferences: notificationPreferences
    },
    { onConflict: "user_id" }
  );

  if (preferencesError) {
    throw new Error(preferencesError.message);
  }
}

async function ensureDevelopmentOrganization(client: ServiceClient, userId: string) {
  const { data: existingOrg, error: existingOrgError } = await client
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", DEV_MASTER_ADMIN_ORG_SLUG)
    .maybeSingle();

  if (existingOrgError) {
    throw new Error(existingOrgError.message);
  }

  const organization =
    existingOrg ??
    (
      await client
        .from("organizations")
        .insert({
          name: DEV_MASTER_ADMIN_ORG_NAME,
          slug: DEV_MASTER_ADMIN_ORG_SLUG,
          created_by: userId
        })
        .select("id, name, slug")
        .single()
    ).data;

  if (!organization) {
    throw new Error("Unable to create or load the development organization.");
  }

  const { error: membershipError } = await client.from("organization_memberships").upsert(
    {
      organization_id: organization.id,
      user_id: userId,
      roles: [...DEV_MASTER_ADMIN_MEMBERSHIP_ROLES],
      status: "active"
    },
    { onConflict: "organization_id,user_id" }
  );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  return organization;
}

async function syncPermissionOverrides(client: ServiceClient, organizationId: string, userId: string) {
  const { data: capabilities, error: capabilitiesError } = await client
    .from("permission_capabilities")
    .select("key")
    .order("key");

  if (capabilitiesError) {
    throw new Error(capabilitiesError.message);
  }

  const overrides = (capabilities ?? []).map((capability) => ({
    organization_id: organizationId,
    role: "property_manager" as const,
    capability_key: capability.key,
    effect: "allow" as const,
    created_by: userId
  }));

  if (overrides.length === 0) {
    return 0;
  }

  const { error } = await client
    .from("organization_permission_overrides")
    .upsert(overrides, { onConflict: "organization_id,role,capability_key" });

  if (error) {
    throw new Error(error.message);
  }

  return overrides.length;
}

async function main() {
  loadEnvFiles();

  if (!isDevEnvironment()) {
    throw new Error(
      "bootstrap-master-admin can only run when NODE_ENV=development or APP_ENV=local."
    );
  }

  const client = createServiceRoleClient();
  const { user, created } = await ensureAuthUser(client);

  await upsertProfileAndPreferences(client, user.id);
  const organization = await ensureDevelopmentOrganization(client, user.id);
  const permissionsGranted = await syncPermissionOverrides(client, organization.id, user.id);

  let seedCounts: Awaited<ReturnType<typeof seedDemoPortfolio>> | null = null;
  let seedError: string | null = null;
  const shouldSeed = await isOrganizationPortfolioEmpty(client, organization.id);
  if (shouldSeed) {
    try {
      seedCounts = await seedDemoPortfolio(client, organization.id, user.id);
    } catch (error) {
      seedError = error instanceof Error ? error.message : "Unknown seed error";
    }
  }

  console.log("Development master administrator bootstrap complete.");
  console.log(
    JSON.stringify(
      {
        environmentGuard: "development-only",
        account: {
          email: DEV_MASTER_ADMIN_EMAIL,
          userId: user.id,
          created,
          displayName: DEV_MASTER_ADMIN_DISPLAY_NAME,
          roleLabel: DEV_MASTER_ADMIN_ROLE_LABEL,
          setupBypassFlag: true
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          roles: [...DEV_MASTER_ADMIN_MEMBERSHIP_ROLES]
        },
        permissionsGranted,
        seedDataCreated: seedCounts,
        seedSkipped: !shouldSeed,
        seedError
      },
      null,
      2
    )
  );

  if (seedError) {
    if (seedError.includes("gen_random_bytes")) {
      console.error(
        "Demo seeding requires the pgcrypto extension (Phase 3 migration). Apply pending Supabase migrations, then re-run: pnpm dev:bootstrap-admin"
      );
    }
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown bootstrap error";
  console.error(`bootstrap-master-admin failed: ${message}`);
  process.exitCode = 1;
});
