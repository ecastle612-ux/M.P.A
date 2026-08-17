import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { connectAccountReady, connectStatusFromStripe, publicConnectView } from "@mpa/shared";
import { orgSkuAllowsResidentialFinance } from "./checkout-authz";
import { emitFinanceEvent, writeFinanceAudit } from "./events-audit";
import { connectedRequestOptions, getStripeClient, isStripeConfigured } from "./stripe";
import { serverEnv } from "../env/server-env";

const CONNECT_REQUESTED_CAPABILITIES = {
  card_payments: { requested: true },
  transfers: { requested: true },
  us_bank_account_ach_payments: { requested: true }
} as const;

function connectMetadataFromStripe(
  existing: Record<string, unknown> | null | undefined,
  remote: Stripe.Account
) {
  const requirements = [
    ...(remote.requirements?.currently_due ?? []),
    ...(remote.requirements?.past_due ?? [])
  ].filter((item) => !item.includes("us_bank_account_ach_payments") && !item.startsWith("capabilities."));
  return {
    ...(existing ?? {}),
    requirements,
    capabilities: {
      card_payments: remote.capabilities?.card_payments ?? "inactive",
      transfers: remote.capabilities?.transfers ?? "inactive",
      us_bank_account_ach_payments: remote.capabilities?.us_bank_account_ach_payments ?? "inactive"
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export { connectAccountReady, publicConnectView };

export async function loadConnectAccount(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("financial_connect_accounts")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function loadConnectAccountByStripeAccountId(supabase: Db, stripeAccountId: string) {
  const { data, error } = await supabase
    .from("financial_connect_accounts")
    .select("*")
    .eq("stripe_account_id", stripeAccountId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export function connectUnavailableResponse(account: {
  status?: string | null;
  charges_enabled?: boolean | null;
  stripe_account_id?: string | null;
} | null) {
  return {
    error: "stripe_connect_not_ready",
    message:
      "Online tenant payments stay unavailable until this organization finishes Stripe Connect onboarding. Manual FIN-OPS charges and payments still work.",
    connect: {
      ready: false,
      status: account?.status ?? "not_started",
      chargesEnabled: account?.charges_enabled === true
    }
  };
}

export async function startConnectOnboarding(
  supabase: Db,
  organizationId: string,
  actorId: string,
  skuCode: string | null
) {
  if (!orgSkuAllowsResidentialFinance(skuCode)) {
    throw new Error("Forbidden");
  }
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe unavailable");
  }

  let account = await loadConnectAccount(supabase, organizationId);
  if (!account) {
    const created = await stripe.accounts.create({
      type: "express",
      country: "US",
      capabilities: CONNECT_REQUESTED_CAPABILITIES,
      metadata: { organization_id: organizationId, domain: "tenant_property" }
    });
    const { data, error } = await supabase
      .from("financial_connect_accounts")
      .insert({
        organization_id: organizationId,
        stripe_account_id: created.id,
        status: "pending",
        charges_enabled: false,
        payouts_enabled: false
      })
      .select("*")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    account = data;
  } else if (!account.stripe_account_id) {
    const created = await stripe.accounts.create({
      type: "express",
      country: "US",
      capabilities: CONNECT_REQUESTED_CAPABILITIES,
      metadata: { organization_id: organizationId, domain: "tenant_property" }
    });
    const { data, error } = await supabase
      .from("financial_connect_accounts")
      .update({
        stripe_account_id: created.id,
        status: "pending",
        updated_at: new Date().toISOString()
      })
      .eq("id", account.id)
      .select("*")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    account = data;
  } else if (account.stripe_account_id) {
    await stripe.accounts.update(account.stripe_account_id as string, {
      capabilities: CONNECT_REQUESTED_CAPABILITIES
    });
  }

  const link = await stripe.accountLinks.create({
    account: account.stripe_account_id as string,
    refresh_url: `${serverEnv.NEXT_PUBLIC_APP_URL}/pm/financial-operations/online-payments?connect=refresh`,
    return_url: `${serverEnv.NEXT_PUBLIC_APP_URL}/pm/financial-operations/online-payments?connect=return`,
    type: "account_onboarding"
  });

  await writeFinanceAudit({
    supabase,
    organizationId,
    actorId,
    action: "finance.connect.status_changed",
    entityType: "financial_connect_account",
    entityId: account.id,
    payload: { stage: "onboarding_link" }
  });

  return { account, onboardingUrl: link.url };
}

export async function syncConnectAccount(supabase: Db, organizationId: string, actorId: string | null) {
  const account = await loadConnectAccount(supabase, organizationId);
  if (!account?.stripe_account_id) {
    return account;
  }
  const stripe = getStripeClient();
  if (!stripe) {
    return account;
  }
  const remote = await stripe.accounts.retrieve(account.stripe_account_id);
  const status = connectStatusFromStripe({
    charges_enabled: remote.charges_enabled,
    payouts_enabled: remote.payouts_enabled,
    details_submitted: remote.details_submitted
  });
  const { data, error } = await supabase
    .from("financial_connect_accounts")
    .update({
      status,
      charges_enabled: remote.charges_enabled === true,
      payouts_enabled: remote.payouts_enabled === true,
      metadata: connectMetadataFromStripe(
        (account.metadata as Record<string, unknown> | null) ?? {},
        remote
      ),
      updated_at: new Date().toISOString()
    })
    .eq("id", account.id)
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  await emitFinanceEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "finance.connect.status_changed",
    aggregateType: "financial_connect_account",
    aggregateId: data.id,
    payload: { status, chargesEnabled: data.charges_enabled }
  });
  return data;
}

export async function createConnectLoginLink(accountId: string) {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Stripe unavailable");
  }
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

export function connectedCheckoutOptions(accountId: string, idempotencyKey: string) {
  return connectedRequestOptions(accountId, idempotencyKey);
}
