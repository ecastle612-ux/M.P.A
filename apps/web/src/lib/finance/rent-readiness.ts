import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

/**
 * Leaf readiness helper for LAUNCH journey J5.
 * Isolated from billing orchestration so Mission Control can query rent
 * readiness without importing charge/payment graph edges.
 */
export async function getRentReadiness(supabase: Db, organizationId: string) {
  const { count, error } = await supabase
    .from("financial_payments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "succeeded");
  if (error) {
    throw new Error(error.message);
  }
  const paymentCount = count ?? 0;
  return {
    paymentCount,
    rentReady: paymentCount > 0
  };
}
