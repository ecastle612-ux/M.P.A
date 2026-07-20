import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isOrganizationPortfolioEmpty,
  seedDemoPortfolio,
  type SeedCounts
} from "../../../scripts/dev/seed-demo-portfolio";

const DEMO_PROPERTY_CODES = ["MAPLE", "HARBOR", "SUMMIT"] as const;

export type MasterAdminSeedResult = {
  seeded: boolean;
  skipped: boolean;
  counts: SeedCounts | null;
  message: string;
};

export type MasterAdminResetResult = {
  softDeletedProperties: number;
  message: string;
};

export async function runMasterAdminSeed(
  client: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<MasterAdminSeedResult> {
  const empty = await isOrganizationPortfolioEmpty(client, organizationId);
  if (!empty) {
    return {
      seeded: false,
      skipped: true,
      counts: null,
      message: "Portfolio already has properties. Reset demo data before seeding again."
    };
  }

  const counts = await seedDemoPortfolio(client, organizationId, userId);
  return {
    seeded: true,
    skipped: false,
    counts,
    message: "Demo portfolio seeded."
  };
}

export async function runMasterAdminReset(
  client: SupabaseClient,
  organizationId: string
): Promise<MasterAdminResetResult> {
  const { data, error } = await client
    .from("properties")
    .update({ deleted_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .in("code", [...DEMO_PROPERTY_CODES])
    .is("deleted_at", null)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  const softDeletedProperties = data?.length ?? 0;
  return {
    softDeletedProperties,
    message:
      softDeletedProperties > 0
        ? `Soft-deleted ${softDeletedProperties} demo properties.`
        : "No active demo properties found to reset."
  };
}
