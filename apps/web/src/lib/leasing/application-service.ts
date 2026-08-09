import type { SupabaseClient } from "@supabase/supabase-js";
import {
  residentDisplayName,
  type CreateApplicationInput,
  type CreateProspectInput,
  type DecideApplicationInput,
  type MarkApplicationIncompleteInput,
  type ResidentStatus
} from "@mpa/shared";
import { emitLeaseEvent, writeLeaseAudit } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type PortfolioApplication = {
  id: string;
  organization_id: string;
  resident_id: string;
  property_id: string;
  unit_id: string | null;
  lease_id: string | null;
  status: string;
  desired_move_in: string | null;
  notes: string | null;
  incomplete_reason: string | null;
  decision_reason: string | null;
  screening_provider: string | null;
  screening_external_id: string | null;
  screening_status: string | null;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
  pm_residents?: {
    id: string;
    display_name: string;
    email: string;
    status: string;
  } | null;
  property_properties?: { id: string; name: string } | null;
  property_units?: { id: string; unit_label: string } | null;
};

const APPLICATION_SELECT =
  "*, pm_residents(id, display_name, email, status), property_properties(id, name), property_units(id, unit_label)";

async function recordApplicationEvent(args: {
  supabase: Db;
  organizationId: string;
  actorId: string | null;
  applicationId: string;
  eventType: string;
  payload?: Record<string, unknown>;
  alsoResidentId?: string | null;
  alsoPropertyId?: string | null;
}) {
  const payload = args.payload ?? {};
  await emitLeaseEvent({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: args.eventType,
    aggregateType: "lease_applications",
    aggregateId: args.applicationId,
    payload
  });
  await writeLeaseAudit({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: args.eventType,
    entityType: "lease_applications",
    entityId: args.applicationId,
    payload
  });
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
}

async function setPersonStatus(
  supabase: Db,
  organizationId: string,
  residentId: string,
  status: ResidentStatus
) {
  const { error } = await supabase
    .from("pm_residents")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", residentId)
    .eq("organization_id", organizationId);
  if (error) {
    throw new Error(error.message);
  }
}

async function findOrCreatePerson(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: {
    firstName: string;
    lastName: string;
    email: string;
    propertyId: string;
    unitId?: string | undefined;
    status: ResidentStatus;
  }
) {
  const email = input.email.trim().toLowerCase();
  const { data: existing, error: existingError } = await supabase
    .from("pm_residents")
    .select("id, status, lease_id, property_id, unit_id, display_name, email")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .maybeSingle();
  if (existingError) {
    throw new Error(existingError.message);
  }
  if (existing) {
    if (existing.lease_id && !["former", "archived"].includes(existing.status as string)) {
      throw new Error("This person already has an active leasing record. Use their existing profile.");
    }
    // Reuse the same person — status-only change, never duplicate.
    const { data: updated, error: updateError } = await supabase
      .from("pm_residents")
      .update({
        status: input.status,
        property_id: input.propertyId,
        unit_id: input.unitId ?? existing.unit_id,
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        display_name: residentDisplayName(input.firstName, input.lastName),
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id)
      .eq("organization_id", organizationId)
      .select("id, display_name, email, status, property_id, unit_id")
      .single();
    if (updateError) {
      throw new Error(updateError.message);
    }
    return updated;
  }

  if (!input.unitId) {
    throw new Error("Unit is required when creating a new person record.");
  }

  const { data: unit, error: unitError } = await supabase
    .from("property_units")
    .select("id, property_id")
    .eq("organization_id", organizationId)
    .eq("id", input.unitId)
    .maybeSingle();
  if (unitError) {
    throw new Error(unitError.message);
  }
  if (!unit || unit.property_id !== input.propertyId) {
    throw new Error("Unit must belong to the selected property.");
  }

  const { data: created, error } = await supabase
    .from("pm_residents")
    .insert({
      organization_id: organizationId,
      property_id: input.propertyId,
      unit_id: input.unitId,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      display_name: residentDisplayName(input.firstName, input.lastName),
      email,
      status: input.status,
      portal_status: "pending_activation",
      created_by: actorId
    })
    .select("id, display_name, email, status, property_id, unit_id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return created;
}

export async function listApplications(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("lease_applications")
    .select(APPLICATION_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as PortfolioApplication[];
}

export async function listProspects(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("pm_residents")
    .select(
      "id, display_name, email, status, property_id, unit_id, created_at, property_properties(id, name), property_units(id, unit_label)"
    )
    .eq("organization_id", organizationId)
    .eq("status", "prospect")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function listMoveInCandidates(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("pm_residents")
    .select(
      "id, display_name, email, status, lease_id, property_properties(id, name), property_units(id, unit_label)"
    )
    .eq("organization_id", organizationId)
    .eq("status", "pending_move_in")
    .order("updated_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function listFormerResidents(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("pm_residents")
    .select(
      "id, display_name, email, status, property_properties(id, name), property_units(id, unit_label)"
    )
    .eq("organization_id", organizationId)
    .in("status", ["former", "archived"])
    .order("updated_at", { ascending: false })
    .limit(40);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function listRenewalCandidates(supabase: Db, organizationId: string, withinDays = 60) {
  const now = new Date();
  const horizon = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("lease_agreements")
    .select(
      "id, status, start_date, end_date, pm_residents(id, display_name, email), property_properties(id, name), property_units(id, unit_label)"
    )
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .not("end_date", "is", null)
    .gte("end_date", today)
    .lte("end_date", horizon)
    .order("end_date", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createProspect(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreateProspectInput
) {
  const { data: property, error: propertyError } = await supabase
    .from("property_properties")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", input.propertyId)
    .maybeSingle();
  if (propertyError) {
    throw new Error(propertyError.message);
  }
  if (!property) {
    throw new Error("Property not found in this organization.");
  }

  const person = await findOrCreatePerson(supabase, organizationId, actorId, {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    propertyId: input.propertyId,
    unitId: input.unitId,
    status: "prospect"
  });

  await emitLeaseEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "prospect.created",
    aggregateType: "pm_residents",
    aggregateId: person.id as string,
    payload: {
      displayName: person.display_name,
      email: person.email,
      notes: input.notes ?? null,
      source: "pm.leasing"
    }
  });

  return { prospect: person };
}

export async function createApplication(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreateApplicationInput
) {
  const { data: property, error: propertyError } = await supabase
    .from("property_properties")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("id", input.propertyId)
    .maybeSingle();
  if (propertyError) {
    throw new Error(propertyError.message);
  }
  if (!property) {
    throw new Error("Property not found in this organization.");
  }

  const person = await findOrCreatePerson(supabase, organizationId, actorId, {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    propertyId: input.propertyId,
    unitId: input.unitId,
    status: "applicant"
  });

  const { data: application, error } = await supabase
    .from("lease_applications")
    .insert({
      organization_id: organizationId,
      resident_id: person.id,
      property_id: input.propertyId,
      unit_id: input.unitId ?? person.unit_id ?? null,
      status: "draft",
      desired_move_in: input.desiredMoveIn ?? null,
      notes: input.notes ?? null,
      screening_status: "not_started",
      created_by: actorId
    })
    .select(APPLICATION_SELECT)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await recordApplicationEvent({
    supabase,
    organizationId,
    actorId,
    applicationId: application.id as string,
    eventType: "application.created",
    payload: {
      residentId: person.id,
      displayName: person.display_name,
      propertyId: input.propertyId,
      source: "pm.leasing"
    },
    alsoResidentId: person.id as string,
    alsoPropertyId: input.propertyId
  });

  return { application: application as PortfolioApplication };
}

export async function submitApplication(
  supabase: Db,
  organizationId: string,
  actorId: string,
  applicationId: string
) {
  const application = await getApplication(supabase, organizationId, applicationId);
  if (!application) {
    throw new Error("Application not found.");
  }
  if (!["draft", "incomplete"].includes(application.status)) {
    throw new Error("Only draft or incomplete applications can be submitted.");
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("lease_applications")
    .update({
      status: "submitted",
      submitted_at: application.submitted_at ?? now,
      incomplete_reason: null,
      updated_at: now
    })
    .eq("id", applicationId)
    .eq("organization_id", organizationId)
    .select(APPLICATION_SELECT)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await setPersonStatus(supabase, organizationId, application.resident_id, "applicant");
  await recordApplicationEvent({
    supabase,
    organizationId,
    actorId,
    applicationId,
    eventType: "application.submitted",
    payload: { status: "submitted" },
    alsoResidentId: application.resident_id,
    alsoPropertyId: application.property_id
  });

  return { application: updated as PortfolioApplication };
}

export async function markApplicationIncomplete(
  supabase: Db,
  organizationId: string,
  actorId: string,
  applicationId: string,
  input: MarkApplicationIncompleteInput
) {
  const application = await getApplication(supabase, organizationId, applicationId);
  if (!application) {
    throw new Error("Application not found.");
  }
  if (!["draft", "submitted", "screening_pending"].includes(application.status)) {
    throw new Error("This application cannot be marked incomplete.");
  }

  const { data: updated, error } = await supabase
    .from("lease_applications")
    .update({
      status: "incomplete",
      incomplete_reason: input.reason,
      updated_at: new Date().toISOString()
    })
    .eq("id", applicationId)
    .eq("organization_id", organizationId)
    .select(APPLICATION_SELECT)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await setPersonStatus(supabase, organizationId, application.resident_id, "applicant");
  await recordApplicationEvent({
    supabase,
    organizationId,
    actorId,
    applicationId,
    eventType: "application.incomplete",
    payload: { reason: input.reason },
    alsoResidentId: application.resident_id,
    alsoPropertyId: application.property_id
  });

  return { application: updated as PortfolioApplication };
}

/**
 * Background screening workflow location only — no provider API.
 * Application → Screening Pending (Integration Planned) → Decision → Lease.
 */
export async function planBackgroundScreening(
  supabase: Db,
  organizationId: string,
  actorId: string,
  applicationId: string
) {
  const application = await getApplication(supabase, organizationId, applicationId);
  if (!application) {
    throw new Error("Application not found.");
  }
  if (!["submitted", "incomplete"].includes(application.status)) {
    throw new Error("Submit the application before entering screening.");
  }

  const { data: updated, error } = await supabase
    .from("lease_applications")
    .update({
      status: "screening_pending",
      screening_status: "planned",
      screening_provider: null,
      screening_external_id: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", applicationId)
    .eq("organization_id", organizationId)
    .select(APPLICATION_SELECT)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await setPersonStatus(supabase, organizationId, application.resident_id, "screening_pending");
  await recordApplicationEvent({
    supabase,
    organizationId,
    actorId,
    applicationId,
    eventType: "application.screening_planned",
    payload: {
      screeningStatus: "planned",
      note: "Background screening provider integration planned — workflow placeholder only."
    },
    alsoResidentId: application.resident_id,
    alsoPropertyId: application.property_id
  });

  return {
    application: updated as PortfolioApplication,
    screeningNote: "Background Screening (Integration Planned) — no provider API in Sprint 1."
  };
}

export async function approveApplication(
  supabase: Db,
  organizationId: string,
  actorId: string,
  applicationId: string,
  input: DecideApplicationInput = {}
) {
  const application = await getApplication(supabase, organizationId, applicationId);
  if (!application) {
    throw new Error("Application not found.");
  }
  if (!["submitted", "screening_pending", "incomplete"].includes(application.status)) {
    throw new Error("This application cannot be approved from its current status.");
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("lease_applications")
    .update({
      status: "approved",
      decision_reason: input.reason ?? null,
      decided_at: now,
      updated_at: now
    })
    .eq("id", applicationId)
    .eq("organization_id", organizationId)
    .select(APPLICATION_SELECT)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  // Same person record — status becomes Approved (lease create moves to Lease Pending).
  await setPersonStatus(supabase, organizationId, application.resident_id, "approved");
  await recordApplicationEvent({
    supabase,
    organizationId,
    actorId,
    applicationId,
    eventType: "application.approved",
    payload: { reason: input.reason ?? null, personStatus: "approved" },
    alsoResidentId: application.resident_id,
    alsoPropertyId: application.property_id
  });

  return {
    application: updated as PortfolioApplication,
    nextStep: "Create lease — existing SignWell signing path applies.",
    assistantRecommendation: "Create the lease and send it for signature."
  };
}

export async function denyApplication(
  supabase: Db,
  organizationId: string,
  actorId: string,
  applicationId: string,
  input: DecideApplicationInput = {}
) {
  const application = await getApplication(supabase, organizationId, applicationId);
  if (!application) {
    throw new Error("Application not found.");
  }
  if (!["submitted", "screening_pending", "incomplete"].includes(application.status)) {
    throw new Error("This application cannot be denied from its current status.");
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("lease_applications")
    .update({
      status: "denied",
      decision_reason: input.reason ?? null,
      decided_at: now,
      updated_at: now
    })
    .eq("id", applicationId)
    .eq("organization_id", organizationId)
    .select(APPLICATION_SELECT)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  // Keep one person record — applicant stays deniable history, not a duplicate.
  await setPersonStatus(supabase, organizationId, application.resident_id, "applicant");
  await recordApplicationEvent({
    supabase,
    organizationId,
    actorId,
    applicationId,
    eventType: "application.denied",
    payload: { reason: input.reason ?? null },
    alsoResidentId: application.resident_id,
    alsoPropertyId: application.property_id
  });

  return { application: updated as PortfolioApplication };
}

export async function getApplication(supabase: Db, organizationId: string, applicationId: string) {
  const { data, error } = await supabase
    .from("lease_applications")
    .select(APPLICATION_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", applicationId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as PortfolioApplication | null) ?? null;
}

export async function getLeasingPipeline(supabase: Db, organizationId: string) {
  const [applications, prospects, moveIns, renewals, moveOuts, pendingLeaseResidents, leases] =
    await Promise.all([
      listApplications(supabase, organizationId),
      listProspects(supabase, organizationId),
      listMoveInCandidates(supabase, organizationId),
      listRenewalCandidates(supabase, organizationId),
      listFormerResidents(supabase, organizationId),
      // Reuse lease-service pending list via inline query for approved/pending_lease
      supabase
        .from("pm_residents")
        .select(
          "id, display_name, email, status, portal_status, property_id, unit_id, property_properties(id, name), property_units(id, unit_label)"
        )
        .eq("organization_id", organizationId)
        .in("status", ["approved", "pending_lease"])
        .is("lease_id", null)
        .then(({ data, error }) => {
          if (error) throw new Error(error.message);
          return data ?? [];
        }),
      supabase
        .from("lease_agreements")
        .select(
          "id, status, start_date, end_date, rent_amount, currency, pm_residents(id, display_name, email), property_properties(id, name), property_units(id, unit_label)"
        )
        .eq("organization_id", organizationId)
        .in("status", ["draft", "pending_signature", "signed"])
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (error) throw new Error(error.message);
          return data ?? [];
        })
    ]);

  return {
    prospects,
    applications,
    awaitingReview: applications.filter((a) =>
      ["submitted", "incomplete"].includes(a.status)
    ),
    screeningPending: applications.filter((a) => a.status === "screening_pending"),
    approvals: applications.filter((a) => a.status === "approved"),
    readyForLease: pendingLeaseResidents,
    leaseSigning: leases,
    moveIns,
    renewals,
    moveOuts
  };
}
