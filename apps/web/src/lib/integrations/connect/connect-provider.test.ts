import { describe, expect, it } from "vitest";
import { deriveConnectAccountStatus, eligibilityLabel, remediationGuidance } from "./eligibility";
import { noopConnectProvider } from "./noop-provider";
import { stripeConnectProvider } from "./stripe-connect-provider";
import {
  getConnectProvider,
  isFin003PhaseAEnabled,
  resolveDefaultConnectProviderId
} from "./registry";

describe("ConnectProvider registry", () => {
  it("defaults to noop without env", () => {
    const previous = process.env["CONNECT_PROVIDER"];
    delete process.env["CONNECT_PROVIDER"];
    expect(resolveDefaultConnectProviderId()).toBe("noop");
    expect(getConnectProvider().id).toBe("noop");
    if (previous) process.env["CONNECT_PROVIDER"] = previous;
  });

  it("resolves stripe provider", () => {
    expect(getConnectProvider("stripe").id).toBe("stripe");
  });

  it("respects phase A disable flag", () => {
    const previous = process.env["FIN003_PHASE_A_ENABLED"];
    process.env["FIN003_PHASE_A_ENABLED"] = "false";
    expect(isFin003PhaseAEnabled()).toBe(false);
    expect(getConnectProvider("stripe").id).toBe("noop");
    if (previous === undefined) delete process.env["FIN003_PHASE_A_ENABLED"];
    else process.env["FIN003_PHASE_A_ENABLED"] = previous;
  });
});

describe("eligibility mapper", () => {
  it("maps eligible owner when payouts enabled", () => {
    expect(
      deriveConnectAccountStatus({
        detailsSubmitted: true,
        chargesEnabled: false,
        payoutsEnabled: true,
        currentlyDue: [],
        pastDue: [],
        disabledReason: null,
        purpose: "owner"
      })
    ).toBe("eligible");
    expect(eligibilityLabel("eligible")).toBe("Eligible");
  });

  it("maps restricted when requirements due", () => {
    expect(
      deriveConnectAccountStatus({
        detailsSubmitted: true,
        chargesEnabled: false,
        payoutsEnabled: false,
        currentlyDue: ["individual.verification.document"],
        pastDue: [],
        disabledReason: null,
        purpose: "owner"
      })
    ).toBe("restricted");
  });

  it("provides remediation guidance without claiming money movement", () => {
    const restricted = remediationGuidance({
      status: "restricted",
      currentlyDue: ["individual.verification.document"],
      pastDue: [],
      disabledReason: null,
      purpose: "owner"
    });
    expect(restricted.remediationRequired).toBe(true);
    expect(restricted.nextStepMessage.toLowerCase()).not.toMatch(/paid|transfer sent|depositing/);

    const eligible = remediationGuidance({
      status: "eligible",
      currentlyDue: [],
      pastDue: [],
      disabledReason: null,
      purpose: "owner"
    });
    expect(eligible.remediationRequired).toBe(false);
    expect(eligible.nextStepMessage.toLowerCase()).toMatch(/not enabled/);
  });
});

describe("noop Connect provider", () => {
  it("creates account and link without network", async () => {
    const account = await noopConnectProvider.createExpressAccount({
      organizationId: "11111111-1111-1111-1111-111111111111",
      purpose: "owner",
      ownerUserId: "22222222-2222-2222-2222-222222222222"
    });
    expect(account.externalAccountId).toContain("noop_acct_owner");

    const link = await noopConnectProvider.createAccountLink({
      externalAccountId: account.externalAccountId,
      refreshUrl: "https://app.example/portal/owner/financials",
      returnUrl: "https://app.example/portal/owner/financials"
    });
    expect(link.url).toContain("connect=noop");

    const snapshot = await noopConnectProvider.getAccount(account.externalAccountId);
    expect(snapshot.status).toBe("onboarding");
  });

  it("parses account webhook events", async () => {
    const events = await noopConnectProvider.parseAccountWebhook(
      { id: "evt_1", type: "account.updated", data: { object: { id: "noop_acct_x" } } },
      {}
    );
    expect(events[0]?.type).toBe("account_updated");
  });
});

describe("stripe Connect provider sandbox", () => {
  it("creates sandbox refs without secret key", async () => {
    const previous = process.env["STRIPE_SECRET_KEY"];
    delete process.env["STRIPE_SECRET_KEY"];
    process.env["STRIPE_MODE"] = "sandbox";

    const account = await stripeConnectProvider.createExpressAccount({
      organizationId: "org",
      purpose: "org_settlement"
    });
    expect(account.externalAccountId).toContain("acct_sandbox_org_settlement");

    if (previous) process.env["STRIPE_SECRET_KEY"] = previous;
  });

  it("rejects invalid Connect webhook signatures when secret set", async () => {
    process.env["STRIPE_CONNECT_WEBHOOK_SECRET"] = "whsec_connect_test";
    process.env["STRIPE_MODE"] = "sandbox";
    await expect(
      stripeConnectProvider.parseAccountWebhook(
        { type: "account.updated" },
        { "x-mpa-raw-body": "{}" }
      )
    ).rejects.toThrow(/signature/i);
    delete process.env["STRIPE_CONNECT_WEBHOOK_SECRET"];
  });

  it("routes transfer events away from account webhook parser", async () => {
    const previousKey = process.env["STRIPE_SECRET_KEY"];
    const previousSecret = process.env["STRIPE_CONNECT_WEBHOOK_SECRET"];
    delete process.env["STRIPE_SECRET_KEY"];
    delete process.env["STRIPE_CONNECT_WEBHOOK_SECRET"];
    process.env["STRIPE_MODE"] = "sandbox";
    const payload = {
      id: "evt_transfer",
      type: "transfer.created",
      data: { object: { id: "tr_test", destination: "acct_owner", amount: 100, currency: "usd" } }
    };
    const raw = JSON.stringify(payload);
    const accountEvents = await stripeConnectProvider.parseAccountWebhook(payload, {
      "x-mpa-raw-body": raw
    });
    expect(accountEvents[0]?.type).toBe("ignored");

    const transferEvents = await stripeConnectProvider.parseTransferWebhook(payload, {
      "x-mpa-raw-body": raw
    });
    expect(transferEvents[0]?.type).toBe("transfer_created");
    expect(transferEvents[0]?.externalTransferId).toBe("tr_test");

    if (previousKey === undefined) delete process.env["STRIPE_SECRET_KEY"];
    else process.env["STRIPE_SECRET_KEY"] = previousKey;
    if (previousSecret) process.env["STRIPE_CONNECT_WEBHOOK_SECRET"] = previousSecret;
    else delete process.env["STRIPE_CONNECT_WEBHOOK_SECRET"];
  });

  it("sandbox createTransfer without secret key", async () => {
    const previousKey = process.env["STRIPE_SECRET_KEY"];
    delete process.env["STRIPE_SECRET_KEY"];
    process.env["STRIPE_MODE"] = "sandbox";
    const ref = await stripeConnectProvider.createTransfer({
      sourceSettlementAccountId: "acct_settlement",
      destinationOwnerAccountId: "acct_owner",
      amountCents: 999,
      currency: "usd",
      idempotencyKey: "fin003-test-key",
      metadata: {
        organizationId: "org",
        payoutRunId: "run",
        transferIntentId: "intent",
        attemptNumber: 1
      }
    });
    expect(ref.externalTransferId).toMatch(/^tr_sandbox_/);
    expect(ref.amountCents).toBe(999);
    if (previousKey === undefined) delete process.env["STRIPE_SECRET_KEY"];
    else process.env["STRIPE_SECRET_KEY"] = previousKey;
  });
});
