import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deriveComplianceStatus,
  todayUtcDate,
  type ComplianceObligationStatus,
  type CreateComplianceObligationInput,
  type SatisfyComplianceObligationInput,
  type WaiveComplianceObligationInput
} from "@mpa/shared";
import { emitFacilityEvent, writeFacilityAudit } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

const SELECT_OBLIGATION = `
  *,
  facility_sites ( id, name, property_id )
`;

export type ComplianceObligationRow = {
  id: string;
  organization_id: string;
  site_id: string;
  title: string;
  authority: string;
  requirement: string | null;
  due_on: string;
  status: ComplianceObligationStatus;
  evidence_document_ids: string[];
  waiver_reason: string | null;
  waived_by_user_id: string | null;
  satisfied_at: string | null;
  waived_at: string | null;
  created_at: string;
  updated_at: string;
  facility_sites?: { id: string; name: string; property_id: string | null } | null;
};

async function recordCompliance(
  supabase: Db,
  args: {
    organizationId: string;
    actorId: string | null;
    aggregateId: string;
    eventType: string;
    payload?: Record<string, unknown>;
  }
) {
  const payload = args.payload ?? {};
  await emitFacilityEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: args.eventType,
    aggregateType: "facility_compliance_obligations",
    aggregateId: args.aggregateId,
    payload
  });
  await writeFacilityAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: args.eventType,
    entityType: "facility_compliance_obligations",
    entityId: args.aggregateId,
    payload
  });
}

function terminalStatus(
  status: ComplianceObligationStatus
): "satisfied" | "waived" | null {
  if (status === "satisfied") {
    return "satisfied";
  }
  if (status === "waived") {
    return "waived";
  }
  return null;
}

async function refreshObligationStatus(
  supabase: Db,
  organizationId: string,
  row: ComplianceObligationRow,
  today: string
): Promise<ComplianceObligationRow> {
  const terminal = terminalStatus(row.status);
  const derived = deriveComplianceStatus(row.due_on, today, terminal);
  if (derived === row.status) {
    return row;
  }

  const { data, error } = await supabase
    .from("facility_compliance_obligations")
    .update({
      status: derived,
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId)
    .eq("id", row.id)
    .select(SELECT_OBLIGATION)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data as ComplianceObligationRow;
}

export async function listComplianceObligations(
  supabase: Db,
  organizationId: string,
  today: string = todayUtcDate()
) {
  const { data, error } = await supabase
    .from("facility_compliance_obligations")
    .select(SELECT_OBLIGATION)
    .eq("organization_id", organizationId)
    .order("due_on", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ComplianceObligationRow[];
  return Promise.all(
    rows.map((row) => refreshObligationStatus(supabase, organizationId, row, today))
  );
}

export async function getComplianceObligation(
  supabase: Db,
  organizationId: string,
  obligationId: string,
  today: string = todayUtcDate()
) {
  const { data, error } = await supabase
    .from("facility_compliance_obligations")
    .select(SELECT_OBLIGATION)
    .eq("organization_id", organizationId)
    .eq("id", obligationId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  return refreshObligationStatus(supabase, organizationId, data as ComplianceObligationRow, today);
}

export async function createComplianceObligation(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CreateComplianceObligationInput
) {
  const { data: site, error: siteError } = await supabase
    .from("facility_sites")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("id", input.siteId)
    .maybeSingle();
  if (siteError) {
    throw new Error(siteError.message);
  }
  if (!site || site.status !== "active") {
    throw new Error("Active facility site required for compliance obligations");
  }

  const today = todayUtcDate();
  const status = deriveComplianceStatus(input.dueOn, today);

  const { data, error } = await supabase
    .from("facility_compliance_obligations")
    .insert({
      organization_id: organizationId,
      site_id: input.siteId,
      title: input.title,
      authority: input.authority,
      requirement: input.requirement ?? null,
      due_on: input.dueOn,
      status
    })
    .select(SELECT_OBLIGATION)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const obligation = data as ComplianceObligationRow;
  await recordCompliance(supabase, {
    organizationId,
    actorId: actorUserId,
    aggregateId: obligation.id,
    eventType: "facility.compliance.obligation_created",
    payload: {
      title: obligation.title,
      authority: obligation.authority,
      due_on: obligation.due_on,
      status: obligation.status,
      site_id: obligation.site_id
    }
  });
  return obligation;
}

async function verifyEvidenceDocuments(
  supabase: Db,
  organizationId: string,
  obligationId: string,
  documentIds: readonly string[]
) {
  const { data, error } = await supabase
    .from("document_documents")
    .select("id, entity_type, entity_id")
    .eq("organization_id", organizationId)
    .in("id", [...documentIds]);
  if (error) {
    throw new Error(error.message);
  }
  const found = data ?? [];
  if (found.length !== documentIds.length) {
    throw new Error("One or more evidence documents were not found");
  }

  const unattached = found.filter(
    (doc) =>
      doc.entity_type !== "facility_compliance_obligation" || doc.entity_id !== obligationId
  );
  if (unattached.length > 0) {
    const { error: attachError } = await supabase
      .from("document_documents")
      .update({
        entity_type: "facility_compliance_obligation",
        entity_id: obligationId
      })
      .eq("organization_id", organizationId)
      .in(
        "id",
        unattached.map((doc) => doc.id as string)
      );
    if (attachError) {
      throw new Error(attachError.message);
    }
  }
}

export async function satisfyComplianceObligation(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: SatisfyComplianceObligationInput
) {
  const existing = await getComplianceObligation(supabase, organizationId, input.obligationId);
  if (!existing) {
    throw new Error("Compliance obligation not found");
  }
  if (existing.status === "satisfied") {
    throw new Error("Obligation is already satisfied");
  }
  if (existing.status === "waived") {
    throw new Error("Waived obligations cannot be satisfied");
  }
  if (input.evidenceDocumentIds.length < 1) {
    throw new Error("At least one evidence document is required");
  }

  await verifyEvidenceDocuments(
    supabase,
    organizationId,
    input.obligationId,
    input.evidenceDocumentIds
  );

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("facility_compliance_obligations")
    .update({
      status: "satisfied",
      evidence_document_ids: input.evidenceDocumentIds,
      satisfied_at: now,
      updated_at: now
    })
    .eq("organization_id", organizationId)
    .eq("id", input.obligationId)
    .select(SELECT_OBLIGATION)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const obligation = data as ComplianceObligationRow;
  await recordCompliance(supabase, {
    organizationId,
    actorId: actorUserId,
    aggregateId: obligation.id,
    eventType: "facility.compliance.satisfied",
    payload: {
      title: obligation.title,
      evidence_document_ids: input.evidenceDocumentIds,
      site_id: obligation.site_id
    }
  });
  return obligation;
}

export async function waiveComplianceObligation(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: WaiveComplianceObligationInput
) {
  const existing = await getComplianceObligation(supabase, organizationId, input.obligationId);
  if (!existing) {
    throw new Error("Compliance obligation not found");
  }
  if (existing.status === "satisfied") {
    throw new Error("Satisfied obligations cannot be waived");
  }
  if (existing.status === "waived") {
    throw new Error("Obligation is already waived");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("facility_compliance_obligations")
    .update({
      status: "waived",
      waiver_reason: input.waiverReason,
      waived_by_user_id: actorUserId,
      waived_at: now,
      updated_at: now
    })
    .eq("organization_id", organizationId)
    .eq("id", input.obligationId)
    .select(SELECT_OBLIGATION)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const obligation = data as ComplianceObligationRow;
  await recordCompliance(supabase, {
    organizationId,
    actorId: actorUserId,
    aggregateId: obligation.id,
    eventType: "facility.compliance.waived",
    payload: {
      title: obligation.title,
      waiver_reason: input.waiverReason,
      site_id: obligation.site_id
    }
  });
  return obligation;
}

export async function searchCompliance(supabase: Db, organizationId: string, query: string) {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  const { data, error } = await supabase
    .from("facility_compliance_obligations")
    .select("id, title, status, authority, due_on")
    .eq("organization_id", organizationId)
    .or(`title.ilike.%${q}%,authority.ilike.%${q}%,requirement.ilike.%${q}%`)
    .order("due_on", { ascending: true })
    .limit(20);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    label: `${row.title as string} · ${row.status as string}`,
    href: `/facility/compliance?obligationId=${row.id as string}`,
    group: "Compliance"
  }));
}

export function summarizeCompliance(
  obligations: readonly ComplianceObligationRow[],
  today: string = todayUtcDate()
) {
  const open = obligations.filter(
    (obligation) => obligation.status !== "satisfied" && obligation.status !== "waived"
  );
  const overdue = open.filter(
    (obligation) => deriveComplianceStatus(obligation.due_on, today) === "overdue"
  );
  const dueToday = open.filter(
    (obligation) => deriveComplianceStatus(obligation.due_on, today) === "due"
  );
  const upcoming = open.filter(
    (obligation) => deriveComplianceStatus(obligation.due_on, today) === "upcoming"
  );
  return {
    total: obligations.length,
    openCount: open.length,
    overdueCount: overdue.length,
    dueTodayCount: dueToday.length,
    upcomingCount: upcoming.length,
    firstOverdueId: overdue[0]?.id ?? dueToday[0]?.id ?? null
  };
}

export function buildComplianceAssistant(summary: {
  overdueCount: number;
  dueTodayCount: number;
  openCount: number;
}) {
  if (summary.overdueCount > 0) {
    return "Satisfy or waive overdue compliance obligations and attach evidence documents.";
  }
  if (summary.dueTodayCount > 0) {
    return "Complete compliance obligations due today before they become overdue.";
  }
  if (summary.openCount > 0) {
    return "Review upcoming compliance obligations and prepare evidence in advance.";
  }
  return "Compliance obligations are current. Add new regulatory requirements as they arise.";
}
