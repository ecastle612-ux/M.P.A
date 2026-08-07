import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LEASE_STATUS_LABELS,
  buildLeaseReadyAssistantCopy,
  buildMaintenanceReadyAssistantCopy,
  buildRentReadyAssistantCopy,
  type CreateLeaseInput,
  type LeaseStatus
} from "@mpa/shared";
import { createRecurringScheduleAndCharge } from "../finance/billing-service";
import {
  createAndSendSignWellDocument,
  getSignWellDocument,
  isSignWellCompletedStatus,
  isSignWellConfigured
} from "../signwell/client";
import { buildLeaseDocumentText, leaseDocumentToBase64 } from "./document";
import { provisionResidentPortalAccess } from "../portal/portal-access-service";
import { emitLeaseEvent, writeLeaseAudit } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type PortfolioLease = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string | null;
  resident_id: string | null;
  status: LeaseStatus;
  start_date: string;
  rent_amount: number;
  currency: string;
  rent_day_of_month: number;
  signing_channel: "signwell" | "offline" | null;
  signwell_document_id: string | null;
  signwell_status: string | null;
  signwell_error: string | null;
  document_name: string | null;
  document_body: string | null;
  manager_name: string | null;
  manager_email: string | null;
  require_manager_signature: boolean;
  signed_at: string | null;
  activated_at: string | null;
  created_at: string;
  property_properties?: { id: string; name: string } | null;
  property_units?: { id: string; unit_label: string; status: string } | null;
  pm_residents?: {
    id: string;
    display_name: string;
    email: string;
    status: string;
    portal_status: string;
  } | null;
};

async function record(args: {
  supabase: Db;
  organizationId: string;
  actorId: string | null;
  leaseId: string;
  eventType: string;
  payload?: Record<string, unknown>;
  alsoPropertyId?: string | null;
  alsoResidentId?: string | null;
}) {
  const payload = args.payload ?? {};
  await emitLeaseEvent({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: args.eventType,
    aggregateType: "lease_agreements",
    aggregateId: args.leaseId,
    payload
  });
  await writeLeaseAudit({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: args.eventType,
    entityType: "lease_agreements",
    entityId: args.leaseId,
    payload
  });
  if (args.alsoPropertyId) {
    await emitLeaseEvent({
      supabase: args.supabase,
      organizationId: args.organizationId,
      actorId: args.actorId,
      eventType: args.eventType,
      aggregateType: "property_properties",
      aggregateId: args.alsoPropertyId,
      payload
    });
  }
  if (args.alsoResidentId) {
    await emitLeaseEvent({
      supabase: args.supabase,
      organizationId: args.organizationId,
      actorId: args.actorId,
      eventType: args.eventType,
      aggregateType: "pm_residents",
      aggregateId: args.alsoResidentId,
      payload
    });
  }
}

export async function getLeaseReadiness(supabase: Db, organizationId: string) {
  const { count, error } = await supabase
    .from("lease_agreements")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["signed", "active"]);
  if (error) {
    throw new Error(error.message);
  }
  const leaseCount = count ?? 0;
  return { leaseCount, leaseReady: leaseCount > 0 };
}

export async function listLeases(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("lease_agreements")
    .select(
      "*, property_properties(id, name), property_units(id, unit_label, status), pm_residents(id, display_name, email, status, portal_status)"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as PortfolioLease[];
}

export async function getLease(supabase: Db, organizationId: string, leaseId: string) {
  const { data, error } = await supabase
    .from("lease_agreements")
    .select(
      "*, property_properties(id, name), property_units(id, unit_label, status), pm_residents(id, display_name, email, status, portal_status)"
    )
    .eq("organization_id", organizationId)
    .eq("id", leaseId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as PortfolioLease | null) ?? null;
}

export async function listPendingLeaseResidents(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("pm_residents")
    .select(
      "id, display_name, email, status, portal_status, property_id, unit_id, property_properties(id, name), property_units(id, unit_label)"
    )
    .eq("organization_id", organizationId)
    .eq("status", "pending_lease")
    .is("lease_id", null)
    .order("display_name");
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createLeaseFromResident(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreateLeaseInput
) {
  const { data: resident, error: residentError } = await supabase
    .from("pm_residents")
    .select(
      "*, property_properties(id, name), property_units(id, unit_label, status)"
    )
    .eq("organization_id", organizationId)
    .eq("id", input.residentId)
    .maybeSingle();
  if (residentError) {
    throw new Error(residentError.message);
  }
  if (!resident) {
    throw new Error("Resident not found.");
  }
  if (resident.lease_id) {
    throw new Error("This resident already has a lease.");
  }
  if (resident.status !== "pending_lease" && resident.status !== "prospect") {
    throw new Error("Select a resident with Pending Lease status.");
  }
  if (input.requireManagerSignature && (!input.managerName || !input.managerEmail)) {
    throw new Error("Manager name and email are required when manager signature is required.");
  }

  const startDate = input.startDate ?? new Date().toISOString().slice(0, 10);
  const propertyName =
    (resident.property_properties as { name?: string } | null)?.name ?? "Property";
  const unitLabel =
    (resident.property_units as { unit_label?: string } | null)?.unit_label ?? "1";
  const documentBody = buildLeaseDocumentText({
    residentName: resident.display_name as string,
    residentEmail: resident.email as string,
    propertyName,
    unitLabel,
    rentAmount: input.rentAmount,
    currency: input.currency,
    startDate,
    dayOfMonth: input.dayOfMonth,
    managerName: input.managerName ?? null,
    organizationLabel: null
  });
  const documentName = `Lease — ${resident.display_name} — Unit ${unitLabel}.txt`;

  const { data: lease, error } = await supabase
    .from("lease_agreements")
    .insert({
      organization_id: organizationId,
      property_id: resident.property_id,
      unit_id: resident.unit_id,
      resident_id: resident.id,
      status: "draft",
      start_date: startDate,
      rent_amount: input.rentAmount,
      currency: input.currency,
      rent_day_of_month: input.dayOfMonth,
      require_manager_signature: input.requireManagerSignature,
      manager_name: input.managerName ?? null,
      manager_email: input.managerEmail ?? null,
      document_name: documentName,
      document_body: documentBody,
      created_by: actorId
    })
    .select(
      "*, property_properties(id, name), property_units(id, unit_label, status), pm_residents(id, display_name, email, status, portal_status)"
    )
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const typed = lease as PortfolioLease;

  await supabase
    .from("pm_residents")
    .update({
      lease_id: typed.id,
      status: "pending_move_in",
      updated_at: new Date().toISOString()
    })
    .eq("id", resident.id)
    .eq("organization_id", organizationId);

  await record({
    supabase,
    organizationId,
    actorId,
    leaseId: typed.id,
    eventType: "lease.created",
    payload: {
      residentId: resident.id,
      displayName: resident.display_name,
      rentAmount: input.rentAmount,
      status: "draft",
      source: "pm.leasing"
    },
    alsoPropertyId: typed.property_id,
    alsoResidentId: resident.id as string
  });

  await record({
    supabase,
    organizationId,
    actorId,
    leaseId: typed.id,
    eventType: "lease.document_generated",
    payload: { documentName, source: "pm.leasing" },
    alsoResidentId: resident.id as string
  });

  return {
    lease: typed,
    assistantRecommendation: "Review the lease, then send it for signature.",
    signWellConfigured: isSignWellConfigured()
  };
}

export async function sendLeaseForSignature(
  supabase: Db,
  organizationId: string,
  actorId: string,
  leaseId: string
) {
  const lease = await getLease(supabase, organizationId, leaseId);
  if (!lease) {
    throw new Error("Lease not found.");
  }
  if (!["draft", "pending_signature"].includes(lease.status)) {
    throw new Error("Only draft or pending-signature leases can be sent.");
  }
  if (!lease.document_body || !lease.document_name) {
    throw new Error("Lease document is missing.");
  }

  const resident = lease.pm_residents;
  if (!resident) {
    throw new Error("Lease resident is missing.");
  }

  if (!isSignWellConfigured()) {
    await supabase
      .from("lease_agreements")
      .update({
        signwell_error: "SIGNWELL_API_KEY not configured — use offline signed path or configure SignWell",
        updated_at: new Date().toISOString()
      })
      .eq("id", leaseId);
    await record({
      supabase,
      organizationId,
      actorId,
      leaseId,
      eventType: "lease.signature_failed",
      payload: {
        reason: "signwell_not_configured",
        note: "Offline signed path remains available for launch honesty."
      }
    });
    return {
      lease: await getLease(supabase, organizationId, leaseId),
      sent: false,
      channel: null as "signwell" | null,
      notice:
        "SignWell is not configured. Use Record signed offline to complete the journey, or set SIGNWELL_API_KEY."
    };
  }

  try {
    const recipients = [
      {
        id: "resident",
        name: resident.display_name,
        email: resident.email,
        placeholder_name: "Resident"
      }
    ];
    if (lease.require_manager_signature && lease.manager_email && lease.manager_name) {
      recipients.push({
        id: "manager",
        name: lease.manager_name,
        email: lease.manager_email,
        placeholder_name: "Manager"
      });
    }

    const document = await createAndSendSignWellDocument({
      name: lease.document_name,
      subject: `Lease agreement — ${resident.display_name}`,
      message: "Please review and sign your lease agreement.",
      fileName: lease.document_name,
      fileBase64: leaseDocumentToBase64(lease.document_body),
      recipients,
      applySigningOrder: true,
      metadata: {
        lease_id: lease.id,
        organization_id: organizationId,
        resident_id: resident.id
      }
    });

    const { data: updated, error } = await supabase
      .from("lease_agreements")
      .update({
        status: "pending_signature",
        signing_channel: "signwell",
        signwell_document_id: document.id,
        signwell_status: document.status,
        signwell_error: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", leaseId)
      .eq("organization_id", organizationId)
      .select(
        "*, property_properties(id, name), property_units(id, unit_label, status), pm_residents(id, display_name, email, status, portal_status)"
      )
      .single();
    if (error) {
      throw new Error(error.message);
    }

    await record({
      supabase,
      organizationId,
      actorId,
      leaseId,
      eventType: "lease.sent_for_signature",
      payload: {
        channel: "signwell",
        signwellDocumentId: document.id,
        signwellStatus: document.status,
        recipients: recipients.map((row) => row.email)
      },
      alsoPropertyId: lease.property_id,
      alsoResidentId: resident.id
    });

    return {
      lease: updated as PortfolioLease,
      sent: true,
      channel: "signwell" as const,
      notice: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SignWell send failed";
    await supabase
      .from("lease_agreements")
      .update({
        signwell_error: message,
        updated_at: new Date().toISOString()
      })
      .eq("id", leaseId);
    await record({
      supabase,
      organizationId,
      actorId,
      leaseId,
      eventType: "lease.signature_failed",
      payload: { reason: "signwell_send_failed", message }
    });
    throw new Error(message);
  }
}

export async function activateSignedLease(
  supabase: Db,
  organizationId: string,
  actorId: string | null,
  leaseId: string,
  options: {
    channel: "signwell" | "offline";
    signwellStatus?: string | null;
    note?: string | null;
  }
) {
  const lease = await getLease(supabase, organizationId, leaseId);
  if (!lease) {
    throw new Error("Lease not found.");
  }
  if (lease.status === "active" && lease.activated_at) {
    // Idempotent remediation: activation may have set portal_status without membership.
    if (lease.resident_id && lease.pm_residents?.email) {
      const { data: residentLink } = await supabase
        .from("pm_residents")
        .select("user_id, email")
        .eq("id", lease.resident_id)
        .maybeSingle();
      await provisionResidentPortalAccess({
        supabase,
        organizationId,
        actorId,
        residentId: lease.resident_id,
        email: (residentLink?.email as string | undefined) ?? lease.pm_residents.email,
        existingUserId: (residentLink?.user_id as string | null | undefined) ?? null
      });
    }
    return {
      lease,
      alreadyActive: true,
      assistantRecommendation: buildLeaseReadyAssistantCopy(
        lease.pm_residents?.display_name ?? "Resident"
      ),
      readyMessage: "My resident is fully onboarded."
    };
  }

  const now = new Date().toISOString();

  const { data: signedLease, error: signError } = await supabase
    .from("lease_agreements")
    .update({
      status: "signed",
      signing_channel: options.channel,
      signwell_status: options.signwellStatus ?? lease.signwell_status,
      signed_at: lease.signed_at ?? now,
      signwell_error: null,
      updated_at: now
    })
    .eq("id", leaseId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (signError) {
    throw new Error(signError.message);
  }

  await record({
    supabase,
    organizationId,
    actorId,
    leaseId,
    eventType: "lease.signed",
    payload: {
      channel: options.channel,
      note: options.note ?? null,
      signwellStatus: options.signwellStatus ?? null
    },
    alsoPropertyId: lease.property_id,
    alsoResidentId: lease.resident_id
  });

  if (lease.unit_id) {
    await supabase
      .from("property_units")
      .update({ status: "occupied" })
      .eq("id", lease.unit_id)
      .eq("organization_id", organizationId);
  }

  if (lease.resident_id) {
    await supabase
      .from("pm_residents")
      .update({
        status: "active",
        portal_status: "active",
        lease_id: leaseId,
        updated_at: now
      })
      .eq("id", lease.resident_id)
      .eq("organization_id", organizationId);
  }

  const residentName = lease.pm_residents?.display_name ?? "Resident";
  const residentEmail = lease.pm_residents?.email ?? null;

  const { data: existingBilling } = await supabase
    .from("lease_residents")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("lease_id", leaseId)
    .maybeSingle();

  const { data: pmResidentRow } = lease.resident_id
    ? await supabase
        .from("pm_residents")
        .select("user_id, email")
        .eq("id", lease.resident_id)
        .maybeSingle()
    : { data: null };

  let linkedUserId = (pmResidentRow?.user_id as string | null | undefined) ?? null;
  if (lease.resident_id && residentEmail) {
    const portalAccess = await provisionResidentPortalAccess({
      supabase,
      organizationId,
      actorId,
      residentId: lease.resident_id,
      email: residentEmail,
      existingUserId: linkedUserId
    });
    linkedUserId = portalAccess.userId;
  } else if (lease.resident_id && !residentEmail) {
    throw new Error(
      "Resident email is required to provision portal access during lease activation."
    );
  }

  if (!existingBilling) {
    const { error: billingError } = await supabase.from("lease_residents").insert({
      organization_id: organizationId,
      lease_id: leaseId,
      user_id: linkedUserId,
      display_name: residentName,
      email: residentEmail ?? (pmResidentRow?.email as string | null | undefined) ?? null,
      is_primary: true,
      financial_status: "current"
    });
    if (billingError) {
      throw new Error(billingError.message);
    }
  } else if (linkedUserId) {
    await supabase
      .from("lease_residents")
      .update({ user_id: linkedUserId })
      .eq("id", existingBilling.id)
      .is("user_id", null);
  }

  await createRecurringScheduleAndCharge(supabase, organizationId, actorId, {
    leaseId,
    chargeType: "rent",
    label: "Monthly rent",
    amount: Number(lease.rent_amount),
    currency: lease.currency,
    dayOfMonth: lease.rent_day_of_month,
    generateCurrentPeriod: true
  });

  const { data: activeLease, error: activateError } = await supabase
    .from("lease_agreements")
    .update({
      status: "active",
      activated_at: now,
      updated_at: now
    })
    .eq("id", leaseId)
    .eq("organization_id", organizationId)
    .select(
      "*, property_properties(id, name), property_units(id, unit_label, status), pm_residents(id, display_name, email, status, portal_status)"
    )
    .single();
  if (activateError) {
    throw new Error(activateError.message);
  }

  await record({
    supabase,
    organizationId,
    actorId,
    leaseId,
    eventType: "lease.activated",
    payload: {
      channel: options.channel,
      residentStatus: "active",
      portalStatus: "active",
      portalAccessRole: "tenant",
      portalUserId: linkedUserId,
      unitStatus: "occupied",
      recurringRent: true,
      displayName: residentName
    },
    alsoPropertyId: lease.property_id,
    alsoResidentId: lease.resident_id
  });

  void signedLease;

  return {
    lease: activeLease as PortfolioLease,
    alreadyActive: false,
    assistantRecommendation: buildLeaseReadyAssistantCopy(residentName),
    readyMessage: "My resident is fully onboarded."
  };
}

export async function completeLeaseOffline(
  supabase: Db,
  organizationId: string,
  actorId: string,
  leaseId: string,
  note?: string
) {
  const lease = await getLease(supabase, organizationId, leaseId);
  if (!lease) {
    throw new Error("Lease not found.");
  }
  if (!["draft", "pending_signature", "signed"].includes(lease.status)) {
    throw new Error("Lease cannot be completed offline from its current status.");
  }
  return activateSignedLease(supabase, organizationId, actorId, leaseId, {
    channel: "offline",
    note: note ?? "Signed offline / uploaded evidence path"
  });
}

export async function syncLeaseFromSignWell(
  supabase: Db,
  organizationId: string,
  actorId: string | null,
  leaseId: string
) {
  const lease = await getLease(supabase, organizationId, leaseId);
  if (!lease) {
    throw new Error("Lease not found.");
  }
  if (!lease.signwell_document_id) {
    throw new Error("Lease has no SignWell document id.");
  }
  if (!isSignWellConfigured()) {
    throw new Error("SIGNWELL_API_KEY is not configured.");
  }

  const document = await getSignWellDocument(lease.signwell_document_id);
  await supabase
    .from("lease_agreements")
    .update({
      signwell_status: document.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", leaseId);

  if (isSignWellCompletedStatus(document.status)) {
    return activateSignedLease(supabase, organizationId, actorId, leaseId, {
      channel: "signwell",
      signwellStatus: document.status
    });
  }

  return {
    lease: await getLease(supabase, organizationId, leaseId),
    alreadyActive: false,
    assistantRecommendation: "Waiting for SignWell signatures to complete.",
    readyMessage: null as string | null,
    signwellStatus: document.status
  };
}

export async function listLeaseTimeline(
  supabase: Db,
  organizationId: string,
  leaseId: string
) {
  const { data, error } = await supabase
    .from("event_domain_events")
    .select("id, event_type, payload, created_at, actor_id")
    .eq("organization_id", organizationId)
    .eq("aggregate_type", "lease_agreements")
    .eq("aggregate_id", leaseId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

function timelineTitle(eventType: string): string {
  switch (eventType) {
    case "lease.created":
      return "Lease created";
    case "lease.document_generated":
      return "Lease document generated";
    case "lease.sent_for_signature":
      return "Sent for signature";
    case "lease.signed":
      return "Lease signed";
    case "lease.activated":
      return "Lease activated";
    case "lease.signature_failed":
      return "Signature issue";
    default:
      return eventType;
  }
}

export async function getLeaseCommandCenter(
  supabase: Db,
  organizationId: string,
  leaseId: string
) {
  const lease = await getLease(supabase, organizationId, leaseId);
  if (!lease) {
    return null;
  }
  const timeline = await listLeaseTimeline(supabase, organizationId, leaseId);
  const residentName = lease.pm_residents?.display_name ?? "Resident";
  const active = lease.status === "active";

  const { data: schedule } = await supabase
    .from("financial_charge_schedules")
    .select("id, next_run_on, amount, day_of_month, active")
    .eq("organization_id", organizationId)
    .eq("lease_id", leaseId)
    .eq("charge_type", "rent")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: leasePaymentCount } = await supabase
    .from("financial_payments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("lease_id", leaseId)
    .eq("status", "succeeded");
  const rentCollected = (leasePaymentCount ?? 0) > 0;
  const { getMaintenanceReadiness } = await import("../maintenance/maintenance-service");
  const maintenance = await getMaintenanceReadiness(supabase, organizationId);

  return {
    lease: {
      id: lease.id,
      status: lease.status,
      statusLabel: LEASE_STATUS_LABELS[lease.status] ?? lease.status,
      rentAmount: Number(lease.rent_amount),
      currency: lease.currency,
      startDate: lease.start_date,
      dayOfMonth: lease.rent_day_of_month,
      signingChannel: lease.signing_channel,
      signwellDocumentId: lease.signwell_document_id,
      signwellStatus: lease.signwell_status,
      signwellError: lease.signwell_error,
      documentName: lease.document_name,
      documentBody: lease.document_body,
      requireManagerSignature: lease.require_manager_signature,
      managerName: lease.manager_name,
      managerEmail: lease.manager_email,
      signedAt: lease.signed_at,
      activatedAt: lease.activated_at,
      propertyId: lease.property_id,
      propertyName: lease.property_properties?.name ?? "Property",
      unitId: lease.unit_id,
      unitLabel: lease.property_units?.unit_label ?? "—",
      residentId: lease.resident_id,
      residentName,
      residentEmail: lease.pm_residents?.email ?? null,
      residentStatus: lease.pm_residents?.status ?? null,
      portalStatus: lease.pm_residents?.portal_status ?? null
    },
    schedule: schedule
      ? {
          id: schedule.id as string,
          nextRunOn: schedule.next_run_on as string,
          amount: Number(schedule.amount),
          dayOfMonth: schedule.day_of_month as number
        }
      : null,
    signWellConfigured: isSignWellConfigured(),
    timeline: timeline.map((event) => ({
      id: event.id as string,
      title: timelineTitle(String(event.event_type)),
      detail:
        typeof (event.payload as { displayName?: string } | null)?.displayName === "string"
          ? `${(event.payload as { displayName: string }).displayName}`
          : String(event.event_type),
      occurredAt: event.created_at as string,
      kind: event.event_type as string
    })),
    assistantRecommendation: maintenance.maintenanceReady
      ? buildMaintenanceReadyAssistantCopy()
      : rentCollected
        ? buildRentReadyAssistantCopy()
        : active
          ? buildLeaseReadyAssistantCopy(residentName)
          : lease.status === "pending_signature"
            ? "Waiting for signatures. Sync SignWell or record offline if needed."
            : "Review the lease, then send it for signature.",
    readyMessage: maintenance.maintenanceReady
      ? "My maintenance operation is working."
      : rentCollected
        ? "My first rent has been collected."
        : active
          ? "My resident is fully onboarded."
          : null,
    nextJourney: maintenance.maintenanceReady
      ? {
          title: "Review today's operations.",
          href: "/pm/mission-control",
          detail: "Maintenance is working — review today's operations."
        }
      : rentCollected
        ? {
            title: "Submit your first maintenance request",
            href: "/pm/maintenance",
            detail: "Continue operations with your first maintenance request."
          }
        : active
          ? {
              title: "Collect your first rent",
              href: "/pm/financial-operations#collect",
              detail: "Financial Operations is ready for the first collection."
            }
          : {
              title: "Send for signature",
              href: `#send`,
              detail: "Use SignWell when configured, or the offline signed honesty path."
            }
  };
}
