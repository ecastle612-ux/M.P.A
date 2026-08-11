/**
 * Slice 4 — next-period Additional Unit Capacity Stripe updates.
 * Uses proration_behavior=none. Never quantity 0 (delete/omit instead).
 * Skips live Stripe calls under VITEST; Production Prices are never created here.
 */

import {
  planStripeCapacityAction,
  unitBlockPriceEnvKey,
  type BillingCycle,
  type NextPeriodStripeCapacityAction
} from "@mpa/shared";
import { getSaasStripeClient, resolveUnitVolumePriceEnv } from "./client";

export type ApplyCapacityStripeResult =
  | {
      ok: true;
      action: NextPeriodStripeCapacityAction;
      stripeAdditionalCapacityItemId: string | null;
      skippedLiveCall: boolean;
    }
  | { ok: false; error: string; action: NextPeriodStripeCapacityAction };

export async function applyNextPeriodCapacityStripeUpdate(input: {
  stripeSubscriptionId: string;
  additionalCapacityItemId: string | null;
  currentBlocks: number;
  nextBlocks: number;
  billingCycle: BillingCycle;
}): Promise<ApplyCapacityStripeResult> {
  const priceEnvKey = unitBlockPriceEnvKey(input.billingCycle);
  const action = planStripeCapacityAction({
    additionalCapacityItemId: input.additionalCapacityItemId,
    currentBlocks: input.currentBlocks,
    nextBlocks: input.nextBlocks,
    unitBlockPriceEnvKey: priceEnvKey
  });

  if (action.kind === "noop") {
    return {
      ok: true,
      action,
      stripeAdditionalCapacityItemId: input.additionalCapacityItemId,
      skippedLiveCall: true
    };
  }

  // Tests / local without Stripe: plan only (no Production mutation).
  if (process.env["VITEST"] || !getSaasStripeClient()) {
    if (action.kind === "create_item") {
      return {
        ok: true,
        action,
        stripeAdditionalCapacityItemId: `si_test_cap_${input.nextBlocks}`,
        skippedLiveCall: true
      };
    }
    if (action.kind === "delete_item") {
      return {
        ok: true,
        action,
        stripeAdditionalCapacityItemId: null,
        skippedLiveCall: true
      };
    }
    return {
      ok: true,
      action,
      stripeAdditionalCapacityItemId: input.additionalCapacityItemId,
      skippedLiveCall: true
    };
  }

  const stripe = getSaasStripeClient();
  if (!stripe) {
    return { ok: false, error: "stripe_not_configured", action };
  }

  try {
    if (action.kind === "update_quantity") {
      await stripe.subscriptionItems.update(action.subscriptionItemId, {
        quantity: action.quantity,
        proration_behavior: "none"
      });
      return {
        ok: true,
        action,
        stripeAdditionalCapacityItemId: action.subscriptionItemId,
        skippedLiveCall: false
      };
    }

    if (action.kind === "delete_item") {
      await stripe.subscriptionItems.del(action.subscriptionItemId, {
        proration_behavior: "none"
      });
      return {
        ok: true,
        action,
        stripeAdditionalCapacityItemId: null,
        skippedLiveCall: false
      };
    }

    // create_item
    const priceId = resolveUnitVolumePriceEnv(action.priceEnvKey);
    if (!priceId) {
      return { ok: false, error: "price_unconfigured", action };
    }
    const created = await stripe.subscriptionItems.create({
      subscription: input.stripeSubscriptionId,
      price: priceId,
      quantity: action.quantity,
      proration_behavior: "none"
    });
    return {
      ok: true,
      action,
      stripeAdditionalCapacityItemId: created.id,
      skippedLiveCall: false
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "stripe_capacity_update_failed",
      action
    };
  }
}
