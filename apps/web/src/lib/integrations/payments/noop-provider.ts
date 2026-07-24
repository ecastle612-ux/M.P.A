import type {
  AttachMethodInput,
  CreateCustomerInput,
  CreatePaymentAttemptInput,
  CustomerRef,
  NormalizedPaymentEvent,
  PaymentAttemptRef,
  PaymentAttemptStatus,
  PaymentMethodRef,
  PaymentProvider,
  RefundInput,
  RefundRef
} from "./contracts";

/**
 * Local/CI provider — no external network.
 * Simulate settlement via BillingService webhook ingress.
 */
export const noopPaymentProvider: PaymentProvider = {
  id: "noop",

  async createCustomer(input: CreateCustomerInput): Promise<CustomerRef> {
    return { externalCustomerId: `noop-cus-${input.tenantId.slice(0, 8)}` };
  },

  async attachPaymentMethod(input: AttachMethodInput): Promise<PaymentMethodRef> {
    const isAch = input.externalPaymentMethodId.toLowerCase().includes("ach");
    return {
      externalMethodId: input.externalPaymentMethodId.startsWith("pm_")
        ? input.externalPaymentMethodId
        : `noop-pm-${input.externalPaymentMethodId.slice(0, 12)}`,
      methodType: isAch ? "ach" : "card",
      brand: isAch ? null : "visa",
      last4: "4242",
      expMonth: isAch ? null : 12,
      expYear: isAch ? null : 2030,
      bankName: isAch ? "Sandbox Bank" : null
    };
  },

  async detachPaymentMethod(): Promise<void> {
    return;
  },

  async createPaymentAttempt(input: CreatePaymentAttemptInput): Promise<PaymentAttemptRef> {
    // C1: noop cannot apply Stripe transfer_data — never invent destination settlement.
    if (input.destinationRouting?.fundingMode === "destination") {
      throw new Error(
        "PAY-001 destination charges are not supported by the noop payment provider (no transfer_data)"
      );
    }
    return {
      externalAttemptId: `noop-pi-${input.attemptNumber}`,
      status: "processing",
      clientSecret: `noop_secret_${input.attemptId}`
    };
  },

  async getPaymentAttempt(ref: PaymentAttemptRef): Promise<PaymentAttemptStatus> {
    return {
      externalAttemptId: ref.externalAttemptId,
      status: ref.status === "succeeded" ? "succeeded" : "processing"
    };
  },

  async cancelPaymentAttempt(): Promise<void> {
    return;
  },

  async refund(input: RefundInput): Promise<RefundRef> {
    return {
      externalRefundId: `noop-re-${Date.now()}`,
      status: "succeeded",
      amountCents: input.amountCents ?? 0
    };
  },

  async parseWebhook(payload: unknown): Promise<NormalizedPaymentEvent[]> {
    const body = (payload ?? {}) as Record<string, unknown>;
    const typeRaw = String(body["type"] ?? body["event"] ?? "succeeded");
    const externalPaymentId =
      typeof body["externalAttemptId"] === "string"
        ? body["externalAttemptId"]
        : typeof body["payment_intent"] === "string"
          ? body["payment_intent"]
          : typeof body["id"] === "string"
            ? body["id"]
            : null;
    const externalEventId =
      typeof body["id"] === "string" && body["id"] !== externalPaymentId
        ? String(body["id"])
        : `noop-${Date.now()}-${typeRaw}`;

    const type: NormalizedPaymentEvent["type"] = typeRaw.includes("fail")
      ? "failed"
      : typeRaw.includes("require")
        ? "requires_action"
        : typeRaw.includes("refund")
          ? "refunded"
          : typeRaw.includes("cancel")
            ? "canceled"
            : typeRaw.includes("process")
              ? "processing"
              : "succeeded";

    return [
      {
        externalEventId,
        externalPaymentId,
        type,
        amountCents: typeof body["amountCents"] === "number" ? body["amountCents"] : null,
        currency: typeof body["currency"] === "string" ? body["currency"] : "usd",
        occurredAt: new Date().toISOString(),
        failureCode: typeof body["failureCode"] === "string" ? body["failureCode"] : null,
        message: typeof body["message"] === "string" ? body["message"] : null
      }
    ];
  }
};
