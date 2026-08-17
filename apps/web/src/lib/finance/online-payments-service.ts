import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AUTOPAY_CONSENT_VERSION,
  ORGANIZATION_DISABLED_ACCEPTED_PAYMENT_METHOD,
  ORGANIZATION_DISABLED_ONLINE_PAYMENTS,
  assertAcceptedMethodsWhileActive,
  canResumeAutopayAfterMethodDisable,
  canResumeAutopayAfterOrgDisable,
  connectPaymentCapabilities,
  customerSafeOnlinePayments,
  enrollmentPaymentMethodType,
  normalizeAcceptedTenantPaymentMethods,
  occupancyIsCurrent,
  offeredTenantPaymentMethods,
  publicConnectView,
  type AcceptedTenantPaymentMethods,
  type TenantPaymentMethodType
} from "@mpa/shared";
import { stripePaymentExecutionEnabled } from "./checkout-authz";
import { connectAccountReady as connectReady, loadConnectAccount } from "./connect-service";
import { emitFinanceEvent, writeFinanceAudit, writeFinanceNotification } from "./events-audit";
import { connectedRequestOptions, getStripeClient } from "./stripe";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export async function loadExecutionEnabled(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("financial_module_settings")
    .select(
      "stripe_payment_execution_enabled, tenant_ach_payments_enabled, tenant_card_payments_enabled"
    )
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return stripePaymentExecutionEnabled(data);
}

export async function loadTenantPaymentGate(supabase: Db, organizationId: string) {
  const [{ data: settings, error }, account] = await Promise.all([
    supabase
      .from("financial_module_settings")
      .select(
        "stripe_payment_execution_enabled, tenant_ach_payments_enabled, tenant_card_payments_enabled"
      )
      .eq("organization_id", organizationId)
      .maybeSingle(),
    loadConnectAccount(supabase, organizationId)
  ]);
  if (error) {
    throw new Error(error.message);
  }
  const accepted = normalizeAcceptedTenantPaymentMethods(settings);
  const supported = connectPaymentCapabilities(account);
  return {
    settings,
    executionEnabled: stripePaymentExecutionEnabled(settings),
    connect: account,
    accepted,
    supported,
    offered: offeredTenantPaymentMethods(accepted, supported)
  };
}

export async function customerOnlinePaymentsStatus(supabase: Db, organizationId: string) {
  const gate = await loadTenantPaymentGate(supabase, organizationId);
  return customerSafeOnlinePayments({
    executionEnabled: gate.executionEnabled,
    connect: publicConnectView(gate.connect),
    accepted: gate.accepted,
    supported: gate.supported
  });
}

async function writeExecutionFlag(supabase: Db, organizationId: string, enabled: boolean) {
  const { data: existing, error: readError } = await supabase
    .from("financial_module_settings")
    .select(
      "id, stripe_payment_execution_enabled, tenant_ach_payments_enabled, tenant_card_payments_enabled"
    )
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (readError) {
    throw new Error(readError.message);
  }
  const previous = existing?.stripe_payment_execution_enabled === true;
  if (existing) {
    const { error } = await supabase
      .from("financial_module_settings")
      .update({
        stripe_payment_execution_enabled: enabled,
        updated_at: new Date().toISOString()
      })
      .eq("organization_id", organizationId)
      .eq("id", existing.id);
    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("financial_module_settings").insert({
      organization_id: organizationId,
      stripe_payment_execution_enabled: enabled,
      tenant_ach_payments_enabled: true,
      tenant_card_payments_enabled: true
    });
    if (error) {
      throw new Error(error.message);
    }
  }
  return { previous, next: enabled };
}

async function residentUserId(supabase: Db, organizationId: string, residentId: string | null) {
  if (!residentId) {
    return null;
  }
  const { data } = await supabase
    .from("lease_residents")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("id", residentId)
    .maybeSingle();
  return (data?.user_id as string | null) ?? null;
}

export async function pauseAutopayForOrganizationDisable(
  supabase: Db,
  args: { organizationId: string; actorId: string }
) {
  const { data: enrollments, error } = await supabase
    .from("financial_autopay_enrollments")
    .select("*")
    .eq("organization_id", args.organizationId)
    .eq("status", "active");
  if (error) {
    throw new Error(error.message);
  }
  const paused = [];
  for (const enrollment of enrollments ?? []) {
    const { data, error: updateError } = await supabase
      .from("financial_autopay_enrollments")
      .update({
        status: "paused",
        paused_reason: ORGANIZATION_DISABLED_ONLINE_PAYMENTS,
        updated_at: new Date().toISOString()
      })
      .eq("id", enrollment.id)
      .eq("organization_id", args.organizationId)
      .eq("status", "active")
      .select("*")
      .single();
    if (updateError) {
      throw new Error(updateError.message);
    }
    paused.push(data);
    const userId = await residentUserId(supabase, args.organizationId, enrollment.resident_id as string | null);
    await writeFinanceNotification({
      supabase,
      organizationId: args.organizationId,
      userId,
      leaseId: enrollment.lease_id as string,
      notificationKey: "finance.autopay.paused",
      title: "Online payments are paused",
      body: "Your property turned off online payments. AutoPay will not charge until they turn it back on. Your authorization is still saved.",
      href: "/portal/tenant/billing"
    });
  }
  return paused;
}

async function paymentMethodUsable(input: {
  stripeAccountId: string;
  paymentMethodId: string | null;
}) {
  if (!input.paymentMethodId) {
    return false;
  }
  const stripe = getStripeClient();
  if (!stripe) {
    return false;
  }
  try {
    const method = await stripe.paymentMethods.retrieve(
      input.paymentMethodId,
      {},
      connectedRequestOptions(input.stripeAccountId)
    );
    return Boolean(method.id);
  } catch {
    return false;
  }
}

export async function resumeAutopayAfterOrganizationEnable(
  supabase: Db,
  args: { organizationId: string; actorId: string }
) {
  const gate = await loadTenantPaymentGate(supabase, args.organizationId);
  const connect = gate.connect;
  if (!connectReady(connect) || !connect?.stripe_account_id) {
    return { resumed: [], leftPaused: [] };
  }
  const { data: enrollments, error } = await supabase
    .from("financial_autopay_enrollments")
    .select("*")
    .eq("organization_id", args.organizationId)
    .eq("status", "paused")
    .eq("paused_reason", ORGANIZATION_DISABLED_ONLINE_PAYMENTS);
  if (error) {
    throw new Error(error.message);
  }
  const resumed = [];
  const leftPaused = [];
  for (const enrollment of enrollments ?? []) {
    const { data: occupant } = await supabase
      .from("lease_residents")
      .select("occupancy_status, occupy_from, occupy_to")
      .eq("organization_id", args.organizationId)
      .eq("id", enrollment.resident_id)
      .maybeSingle();
    const occupancyCurrent = Boolean(
      occupant &&
        occupancyIsCurrent({
          occupancyStatus: (occupant.occupancy_status as "scheduled" | "occupying" | "moved_out") ?? "occupying",
          occupyFrom: (occupant.occupy_from as string | null) ?? "1970-01-01",
          occupyTo: (occupant.occupy_to as string | null) ?? null
        })
    );
    const methodOk = await paymentMethodUsable({
      stripeAccountId: connect.stripe_account_id,
      paymentMethodId: (enrollment.stripe_payment_method_id as string | null) ?? null
    });
    const methodType = enrollmentPaymentMethodType(enrollment);
    const eligible = canResumeAutopayAfterOrgDisable({
      status: enrollment.status,
      pausedReason: enrollment.paused_reason,
      consentVersion: enrollment.consent_version,
      occupancyCurrent,
      hasPaymentMethod: methodOk,
      connectReady: true,
      executionEnabled: true,
      methodOffered: gate.offered.includes(methodType)
    });
    if (!eligible || enrollment.consent_version !== AUTOPAY_CONSENT_VERSION) {
      leftPaused.push(enrollment);
      continue;
    }
    const { data, error: updateError } = await supabase
      .from("financial_autopay_enrollments")
      .update({
        status: "active",
        paused_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", enrollment.id)
      .eq("organization_id", args.organizationId)
      .select("*")
      .single();
    if (updateError) {
      throw new Error(updateError.message);
    }
    resumed.push(data);
    const userId = await residentUserId(supabase, args.organizationId, enrollment.resident_id as string | null);
    await writeFinanceNotification({
      supabase,
      organizationId: args.organizationId,
      userId,
      leaseId: enrollment.lease_id as string,
      notificationKey: "finance.autopay.resumed",
      title: "AutoPay is on again",
      body: "Your property turned online payments back on. The next posted eligible charges may be collected with your saved payment method.",
      href: "/portal/tenant/billing"
    });
  }
  return { resumed, leftPaused };
}

async function writeAcceptedMethods(
  supabase: Db,
  organizationId: string,
  accepted: AcceptedTenantPaymentMethods
) {
  const { data: existing, error: readError } = await supabase
    .from("financial_module_settings")
    .select("id")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (readError) {
    throw new Error(readError.message);
  }
  const patch = {
    tenant_ach_payments_enabled: accepted.achEnabled,
    tenant_card_payments_enabled: accepted.cardEnabled,
    updated_at: new Date().toISOString()
  };
  if (existing) {
    const { error } = await supabase
      .from("financial_module_settings")
      .update(patch)
      .eq("organization_id", organizationId)
      .eq("id", existing.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }
  const { error } = await supabase.from("financial_module_settings").insert({
    organization_id: organizationId,
    stripe_payment_execution_enabled: false,
    ...patch
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function pauseAutopayForDisabledMethod(
  supabase: Db,
  args: { organizationId: string; actorId: string; disabledType: TenantPaymentMethodType }
) {
  const { data: enrollments, error } = await supabase
    .from("financial_autopay_enrollments")
    .select("*")
    .eq("organization_id", args.organizationId)
    .eq("status", "active");
  if (error) {
    throw new Error(error.message);
  }
  const paused = [];
  for (const enrollment of enrollments ?? []) {
    if (enrollmentPaymentMethodType(enrollment) !== args.disabledType) {
      continue;
    }
    const { data, error: updateError } = await supabase
      .from("financial_autopay_enrollments")
      .update({
        status: "paused",
        paused_reason: ORGANIZATION_DISABLED_ACCEPTED_PAYMENT_METHOD,
        updated_at: new Date().toISOString()
      })
      .eq("id", enrollment.id)
      .eq("organization_id", args.organizationId)
      .eq("status", "active")
      .select("*")
      .single();
    if (updateError) {
      throw new Error(updateError.message);
    }
    paused.push(data);
    const userId = await residentUserId(supabase, args.organizationId, enrollment.resident_id as string | null);
    await writeFinanceNotification({
      supabase,
      organizationId: args.organizationId,
      userId,
      leaseId: enrollment.lease_id as string,
      notificationKey: "finance.autopay.paused",
      title: "AutoPay is paused",
      body: "Your property no longer accepts that payment method. AutoPay will not charge. Your authorization is still saved. Choose another allowed method if you want AutoPay on again.",
      href: "/portal/tenant/billing"
    });
  }
  return paused;
}

export async function resumeAutopayAfterMethodEnable(
  supabase: Db,
  args: { organizationId: string; actorId: string; enabledType: TenantPaymentMethodType }
) {
  const gate = await loadTenantPaymentGate(supabase, args.organizationId);
  if (!connectReady(gate.connect) || !gate.connect?.stripe_account_id || !gate.executionEnabled) {
    return { resumed: [], leftPaused: [] };
  }
  if (!gate.offered.includes(args.enabledType)) {
    return { resumed: [], leftPaused: [] };
  }
  const { data: enrollments, error } = await supabase
    .from("financial_autopay_enrollments")
    .select("*")
    .eq("organization_id", args.organizationId)
    .eq("status", "paused")
    .eq("paused_reason", ORGANIZATION_DISABLED_ACCEPTED_PAYMENT_METHOD);
  if (error) {
    throw new Error(error.message);
  }
  const resumed = [];
  const leftPaused = [];
  for (const enrollment of enrollments ?? []) {
    if (enrollmentPaymentMethodType(enrollment) !== args.enabledType) {
      leftPaused.push(enrollment);
      continue;
    }
    const { data: occupant } = await supabase
      .from("lease_residents")
      .select("occupancy_status, occupy_from, occupy_to")
      .eq("organization_id", args.organizationId)
      .eq("id", enrollment.resident_id)
      .maybeSingle();
    const occupancyCurrent = Boolean(
      occupant &&
        occupancyIsCurrent({
          occupancyStatus: (occupant.occupancy_status as "scheduled" | "occupying" | "moved_out") ?? "occupying",
          occupyFrom: (occupant.occupy_from as string | null) ?? "1970-01-01",
          occupyTo: (occupant.occupy_to as string | null) ?? null
        })
    );
    const methodOk = await paymentMethodUsable({
      stripeAccountId: gate.connect.stripe_account_id as string,
      paymentMethodId: (enrollment.stripe_payment_method_id as string | null) ?? null
    });
    const eligible = canResumeAutopayAfterMethodDisable({
      status: enrollment.status,
      pausedReason: enrollment.paused_reason,
      consentVersion: enrollment.consent_version,
      paymentMethodType: enrollment.payment_method_type,
      occupancyCurrent,
      hasPaymentMethod: methodOk,
      connectReady: true,
      executionEnabled: true,
      methodOffered: true
    });
    if (!eligible) {
      leftPaused.push(enrollment);
      continue;
    }
    const { data, error: updateError } = await supabase
      .from("financial_autopay_enrollments")
      .update({
        status: "active",
        paused_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", enrollment.id)
      .eq("organization_id", args.organizationId)
      .select("*")
      .single();
    if (updateError) {
      throw new Error(updateError.message);
    }
    resumed.push(data);
    const userId = await residentUserId(supabase, args.organizationId, enrollment.resident_id as string | null);
    await writeFinanceNotification({
      supabase,
      organizationId: args.organizationId,
      userId,
      leaseId: enrollment.lease_id as string,
      notificationKey: "finance.autopay.resumed",
      title: "AutoPay is on again",
      body: "Your property accepts that payment method again. The next posted eligible charges may be collected with your saved payment method.",
      href: "/portal/tenant/billing"
    });
  }
  return { resumed, leftPaused };
}

export async function updateAcceptedTenantPaymentMethods(
  supabase: Db,
  args: {
    organizationId: string;
    actorId: string;
    accepted: AcceptedTenantPaymentMethods;
  }
) {
  const gate = await loadTenantPaymentGate(supabase, args.organizationId);
  const nextCheck = assertAcceptedMethodsWhileActive({
    executionEnabled: gate.executionEnabled,
    accepted: args.accepted,
    supported: gate.supported
  });
  if (!nextCheck.ok) {
    throw new Error("accepted_payment_method_required");
  }
  await writeAcceptedMethods(supabase, args.organizationId, args.accepted);
  const paused = [];
  const resumed = [];
  if (gate.accepted.achEnabled && !args.accepted.achEnabled) {
    paused.push(
      ...(await pauseAutopayForDisabledMethod(supabase, {
        organizationId: args.organizationId,
        actorId: args.actorId,
        disabledType: "us_bank_account"
      }))
    );
  }
  if (gate.accepted.cardEnabled && !args.accepted.cardEnabled) {
    paused.push(
      ...(await pauseAutopayForDisabledMethod(supabase, {
        organizationId: args.organizationId,
        actorId: args.actorId,
        disabledType: "card"
      }))
    );
  }
  if (!gate.accepted.achEnabled && args.accepted.achEnabled) {
    resumed.push(
      ...(
        await resumeAutopayAfterMethodEnable(supabase, {
          organizationId: args.organizationId,
          actorId: args.actorId,
          enabledType: "us_bank_account"
        })
      ).resumed
    );
  }
  if (!gate.accepted.cardEnabled && args.accepted.cardEnabled) {
    resumed.push(
      ...(
        await resumeAutopayAfterMethodEnable(supabase, {
          organizationId: args.organizationId,
          actorId: args.actorId,
          enabledType: "card"
        })
      ).resumed
    );
  }
  await writeFinanceAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: "finance.online_payments.methods_updated",
    entityType: "financial_module_settings",
    payload: {
      previous: gate.accepted,
      next: args.accepted,
      pausedAutopay: paused.length,
      resumedAutopay: resumed.length,
      noSilentSubstitution: true
    }
  });
  return { accepted: args.accepted, paused, resumed };
}

export async function enableOnlinePayments(
  supabase: Db,
  args: { organizationId: string; actorId: string }
) {
  const connect = await loadConnectAccount(supabase, args.organizationId);
  if (!connectReady(connect)) {
    const error = new Error("connect_not_ready");
    throw error;
  }
  const gate = await loadTenantPaymentGate(supabase, args.organizationId);
  const defaults = assertAcceptedMethodsWhileActive({
    executionEnabled: true,
    accepted: gate.accepted,
    supported: gate.supported
  });
  if (!defaults.ok) {
    const fallback: AcceptedTenantPaymentMethods = {
      achEnabled: gate.supported.achSupported,
      cardEnabled: gate.supported.cardSupported
    };
    const fallbackCheck = assertAcceptedMethodsWhileActive({
      executionEnabled: true,
      accepted: fallback,
      supported: gate.supported
    });
    if (!fallbackCheck.ok) {
      throw new Error("accepted_payment_method_required");
    }
    await writeAcceptedMethods(supabase, args.organizationId, fallback);
  }
  const flag = await writeExecutionFlag(supabase, args.organizationId, true);
  const resume = await resumeAutopayAfterOrganizationEnable(supabase, args);
  await writeFinanceAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: "finance.online_payments.enabled",
    entityType: "financial_module_settings",
    payload: {
      previous: flag.previous,
      next: flag.next,
      connectReady: true,
      connectStatus: connect?.status ?? null,
      resumedAutopay: resume.resumed.length,
      leftPaused: resume.leftPaused.length
    }
  });
  await emitFinanceEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: "finance.connect.status_changed",
    aggregateType: "financial_module_settings",
    aggregateId: args.organizationId,
    payload: { executionEnabled: true }
  });
  return { ...flag, resume };
}

export async function disableOnlinePayments(
  supabase: Db,
  args: { organizationId: string; actorId: string }
) {
  const connect = await loadConnectAccount(supabase, args.organizationId);
  const flag = await writeExecutionFlag(supabase, args.organizationId, false);
  const paused = await pauseAutopayForOrganizationDisable(supabase, args);
  await writeFinanceAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: "finance.online_payments.disabled",
    entityType: "financial_module_settings",
    payload: {
      previous: flag.previous,
      next: flag.next,
      connectReady: connectReady(connect),
      connectStatus: connect?.status ?? null,
      pausedAutopay: paused.length,
      connectPreserved: true,
      historyPreserved: true
    }
  });
  await emitFinanceEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: "finance.connect.status_changed",
    aggregateType: "financial_module_settings",
    aggregateId: args.organizationId,
    payload: { executionEnabled: false }
  });
  return { ...flag, paused };
}

