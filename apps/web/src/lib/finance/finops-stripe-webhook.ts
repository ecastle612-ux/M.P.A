export type FinOpsPendingPayment = {
  id: string;
  organization_id: string;
  lease_id: string;
  amount: number | string;
  status: string;
  stripe_checkout_session_id?: string | null;
};

export type CheckoutSessionCompletedResolution =
  | { action: "already_succeeded"; paymentId: string }
  | { action: "apply"; paymentId: string; amount: number }
  | { action: "refuse"; error: string };

export type CheckoutFailureResolution =
  | { action: "mark_failed"; paymentId: string }
  | { action: "refuse"; error: string }
  | { action: "ignore" };

/**
 * FIN-OPS operational webhook may complete only against an existing pending payment.
 * It must never invent a payment or take applySucceededPayment's insert-without-id branch.
 */
export function resolveCheckoutSessionCompleted(input: {
  payment: FinOpsPendingPayment | null;
  organizationId: string;
  leaseId: string;
  checkoutSessionId: string;
  amountTotalCents: number | null;
}): CheckoutSessionCompletedResolution {
  const payment = input.payment;
  if (!payment) {
    return { action: "refuse", error: "pending_payment_missing" };
  }
  if (payment.organization_id !== input.organizationId || payment.lease_id !== input.leaseId) {
    return { action: "refuse", error: "pending_payment_mismatch" };
  }
  if (
    payment.stripe_checkout_session_id &&
    payment.stripe_checkout_session_id !== input.checkoutSessionId
  ) {
    return { action: "refuse", error: "pending_payment_mismatch" };
  }
  if (payment.status === "succeeded") {
    return { action: "already_succeeded", paymentId: payment.id };
  }
  if (payment.status !== "pending" && payment.status !== "processing") {
    return { action: "refuse", error: "pending_payment_mismatch" };
  }

  const pendingAmount = Number(payment.amount);
  const sessionAmount =
    input.amountTotalCents != null ? input.amountTotalCents / 100 : pendingAmount;
  if (input.amountTotalCents != null && Math.abs(sessionAmount - pendingAmount) > 0.009) {
    return { action: "refuse", error: "pending_payment_mismatch" };
  }

  return { action: "apply", paymentId: payment.id, amount: sessionAmount };
}

export function resolvePaymentIntentSucceeded(input: {
  payment: FinOpsPendingPayment | null;
  organizationId: string;
  leaseId: string;
  amountTotalCents: number | null;
}): CheckoutSessionCompletedResolution {
  return resolveCheckoutSessionCompleted({
    ...input,
    checkoutSessionId: input.payment?.stripe_checkout_session_id ?? "pi"
  });
}

export function resolveCheckoutFailure(input: {
  paymentId: string | null | undefined;
  organizationId: string | null | undefined;
  payment: FinOpsPendingPayment | null;
}): CheckoutFailureResolution {
  if (!input.paymentId || !input.organizationId) {
    return { action: "ignore" };
  }
  if (!input.payment) {
    return { action: "refuse", error: "pending_payment_missing" };
  }
  if (input.payment.id !== input.paymentId || input.payment.organization_id !== input.organizationId) {
    return { action: "refuse", error: "pending_payment_mismatch" };
  }
  if (input.payment.status === "failed") {
    return { action: "ignore" };
  }
  if (input.payment.status === "succeeded" || input.payment.status === "refunded") {
    return { action: "ignore" };
  }
  if (input.payment.status !== "pending" && input.payment.status !== "processing") {
    return { action: "refuse", error: "pending_payment_mismatch" };
  }
  return { action: "mark_failed", paymentId: input.payment.id };
}

export function resolveCheckoutSessionLifecycle(input: {
  payment: FinOpsPendingPayment | null;
  organizationId: string;
  leaseId: string;
  checkoutSessionId: string;
  amountTotalCents: number | null;
  paymentStatus?: string | null;
}): CheckoutSessionCompletedResolution | { action: "mark_processing"; paymentId: string } {
  if (input.paymentStatus && input.paymentStatus !== "paid") {
    const payment = input.payment;
    if (!payment) {
      return { action: "refuse", error: "pending_payment_missing" };
    }
    if (payment.status === "succeeded") {
      return { action: "already_succeeded", paymentId: payment.id };
    }
    if (payment.status !== "pending" && payment.status !== "processing") {
      return { action: "refuse", error: "pending_payment_mismatch" };
    }
    return { action: "mark_processing", paymentId: payment.id };
  }
  return resolveCheckoutSessionCompleted(input);
}

export function classifyFinanceMutationError(message: string): "frozen" | "authorization" | "other" {
  if (message.includes("finance_ops_writes_frozen")) {
    return "frozen";
  }
  if (
    message === "Forbidden" ||
    message === "Unauthenticated" ||
    message === "finance_m5_not_authorized"
  ) {
    return "authorization";
  }
  return "other";
}
