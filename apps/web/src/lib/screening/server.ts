/**
 * ScreeningService — sole domain entry for API-003.
 * Never call ScreeningProvider from UI or other business modules.
 */
import { randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@mpa/supabase";
import { createAuthServerComponentClient, createServiceRoleServerClient } from "../auth/server";
import { getScreeningProvider, resolveDefaultScreeningProviderId } from "../integrations/screening/registry";
import { notify } from "../notifications/service";
import { createVaultDocument } from "../vault/server";
import { recordApplicantEvent } from "../applicant/events";
import type {
  CreateScreeningCaseInput,
  GrantConsentInput,
  NormalizedScreeningReport,
  RecordDecisionInput,
  ScreeningCaseRecord,
  ScreeningCaseStatus,
  ScreeningComponentRecord,
  ScreeningComponentType,
  ScreeningDecision,
  ScreeningFlag,
  ScreeningOpsSnapshot,
  ScreeningPartyRecord,
  ScreeningProgressStep,
  ScreeningPartyRole
} from "./contracts";
import { packageComponentsFor } from "./contracts";

// API-003 tables are not yet in generated Database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScreeningClient = any;

async function resolveClient(client?: SupabaseClient<Database>): Promise<ScreeningClient> {
  return client ?? (await createAuthServerComponentClient());
}

async function adminClient(): Promise<ScreeningClient> {
  return createServiceRoleServerClient() as ScreeningClient;
}

type ApplicantLite = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  propertyId: string | null;
  unitId: string | null;
  assignedPmId: string | null;
};

async function getApplicantLite(
  organizationId: string,
  applicantId: string,
  client: ScreeningClient
): Promise<ApplicantLite | null> {
  const { data, error } = await client
    .from("applicants")
    .select("id, first_name, last_name, email, phone, property_id, unit_id, assigned_pm_id")
    .eq("organization_id", organizationId)
    .eq("id", applicantId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id as string,
    firstName: data.first_name as string,
    lastName: data.last_name as string,
    email: data.email as string,
    phone: (data.phone as string | null) ?? null,
    propertyId: (data.property_id as string | null) ?? null,
    unitId: (data.unit_id as string | null) ?? null,
    assignedPmId: (data.assigned_pm_id as string | null) ?? null
  };
}

function mapCase(row: Record<string, unknown>): ScreeningCaseRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    applicantId: String(row["applicant_id"]),
    caseNumber: String(row["case_number"]),
    provider: String(row["provider"]),
    packageCode: String(row["package_code"] ?? "standard_rental"),
    status: String(row["status"]) as ScreeningCaseStatus,
    externalReference: (row["external_reference"] as string | null) ?? null,
    resultSummary: (row["result_summary"] as string | null) ?? null,
    normalizedSummary: (row["normalized_summary"] as Record<string, unknown>) ?? {},
    decision: (row["decision"] as ScreeningDecision | null) ?? null,
    expiresAt: (row["expires_at"] as string | null) ?? null,
    consentCompletedAt: (row["consent_completed_at"] as string | null) ?? null,
    readyForReviewAt: (row["ready_for_review_at"] as string | null) ?? null,
    decidedAt: (row["decided_at"] as string | null) ?? null,
    leaseId: (row["lease_id"] as string | null) ?? null,
    supersedesCaseId: (row["supersedes_case_id"] as string | null) ?? null,
    retryCount: Number(row["retry_count"] ?? 0),
    lastError: (row["last_error"] as string | null) ?? null,
    metadata: (row["metadata"] as Record<string, unknown>) ?? {},
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"])
  };
}

function mapParty(row: Record<string, unknown>): ScreeningPartyRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    screeningCaseId: String(row["screening_case_id"]),
    applicantId: (row["applicant_id"] as string | null) ?? null,
    role: String(row["role"]) as ScreeningPartyRole,
    fullName: String(row["full_name"]),
    email: (row["email"] as string | null) ?? null,
    phone: (row["phone"] as string | null) ?? null,
    status: String(row["status"]),
    consentToken: (row["consent_token"] as string | null) ?? null,
    consentTokenExpiresAt: (row["consent_token_expires_at"] as string | null) ?? null,
    externalCandidateId: (row["external_candidate_id"] as string | null) ?? null
  };
}

function mapComponent(row: Record<string, unknown>): ScreeningComponentRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    screeningCaseId: String(row["screening_case_id"]),
    screeningPartyId: (row["screening_party_id"] as string | null) ?? null,
    componentType: String(row["component_type"]) as ScreeningComponentType,
    status: String(row["status"]) as ScreeningComponentRecord["status"],
    flags: Array.isArray(row["flags"]) ? (row["flags"] as ScreeningFlag[]) : [],
    providerReference: (row["provider_reference"] as string | null) ?? null,
    summary: (row["summary"] as string | null) ?? null,
    completedAt: (row["completed_at"] as string | null) ?? null,
    vaultDocumentId: (row["vault_document_id"] as string | null) ?? null
  };
}

async function writeAudit(
  organizationId: string,
  screeningCaseId: string | null,
  actorUserId: string | null,
  eventType: string,
  message: string,
  metadata: Record<string, unknown>,
  client: ScreeningClient
) {
  await client.from("screening_audit_events").insert({
    organization_id: organizationId,
    screening_case_id: screeningCaseId,
    actor_user_id: actorUserId,
    event_type: eventType,
    message,
    metadata: metadata as Json
  });
}

async function generateCaseNumber(organizationId: string, client: ScreeningClient): Promise<string> {
  const { count } = await client
    .from("screening_cases")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  const next = (count ?? 0) + 1;
  return `SCR-${String(next).padStart(5, "0")}`;
}

async function ensureConsentVersion(organizationId: string, userId: string, client: ScreeningClient) {
  const { data: existing } = await client
    .from("screening_consent_versions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await client
    .from("screening_consent_versions")
    .insert({
      organization_id: organizationId,
      version: 1,
      disclosure_title: "Background Screening Disclosure",
      disclosure_body:
        "M.P.A. and its screening provider may obtain consumer reports for rental application purposes under the Fair Credit Reporting Act (FCRA). Reports may include credit, criminal, eviction, and identity information.",
      authorization_body:
        "I authorize the procurement of consumer reports for rental screening. I certify the information I provide is accurate. I understand I may receive adverse action notices if reports contribute to an adverse decision.",
      is_active: true,
      created_by: userId
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create consent version");
  return data;
}

async function getSettings(organizationId: string, client: ScreeningClient) {
  const { data } = await client
    .from("organization_screening_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  return {
    provider: (data?.provider as string | undefined) ?? resolveDefaultScreeningProviderId(),
    packageCode: (data?.package_code as string | undefined) ?? "standard_rental",
    reportRetentionDays: (data?.report_retention_days as number | undefined) ?? 365,
    adverseActionRequired: data?.adverse_action_required !== false,
    adverseActionWaitHours: (data?.adverse_action_wait_hours as number | undefined) ?? 72
  };
}

export async function listScreeningCases(
  organizationId: string,
  filters: { applicantId?: string; status?: string } = {},
  client?: ScreeningClient
): Promise<ScreeningCaseRecord[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("screening_cases")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (filters.applicantId) query = query.eq("applicant_id", filters.applicantId);
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => mapCase(row));
}

export async function getScreeningCase(
  organizationId: string,
  caseId: string,
  client?: ScreeningClient
): Promise<ScreeningCaseRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("screening_cases")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", caseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCase(data as Record<string, unknown>) : null;
}

export async function getScreeningCaseDetail(
  organizationId: string,
  caseId: string,
  client?: ScreeningClient
) {
  const supabase = await resolveClient(client);
  const screeningCase = await getScreeningCase(organizationId, caseId, supabase);
  if (!screeningCase) return null;

  const [{ data: parties }, { data: components }, { data: decision }, { data: conditions }, { data: adverse }, { data: audit }] =
    await Promise.all([
      supabase.from("screening_parties").select("*").eq("screening_case_id", caseId).eq("organization_id", organizationId),
      supabase.from("screening_components").select("*").eq("screening_case_id", caseId).eq("organization_id", organizationId),
      supabase.from("screening_decisions").select("*").eq("screening_case_id", caseId).eq("organization_id", organizationId).maybeSingle(),
      supabase.from("screening_conditions").select("*").eq("screening_case_id", caseId).eq("organization_id", organizationId),
      supabase
        .from("screening_adverse_actions")
        .select("*")
        .eq("screening_case_id", caseId)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true }),
      supabase
        .from("screening_audit_events")
        .select("*")
        .eq("screening_case_id", caseId)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(50)
    ]);

  return {
    case: screeningCase,
    parties: (parties ?? []).map((row: Record<string, unknown>) => mapParty(row)),
    components: (components ?? []).map((row: Record<string, unknown>) => mapComponent(row)),
    decision: decision ?? null,
    conditions: conditions ?? [],
    adverseActions: adverse ?? [],
    audit: audit ?? [],
    progress: buildProgress(screeningCase, (components ?? []).map((row: Record<string, unknown>) => mapComponent(row)))
  };
}

function buildProgress(
  screeningCase: ScreeningCaseRecord,
  components: ScreeningComponentRecord[]
): ScreeningProgressStep[] {
  const step = (
    key: string,
    label: string,
    status: ScreeningProgressStep["status"]
  ): ScreeningProgressStep => ({ key, label, status });

  const consentStatus: ScreeningProgressStep["status"] = screeningCase.consentCompletedAt
    ? "complete"
    : screeningCase.status === "awaiting_consent"
      ? "in_progress"
      : "pending";

  const componentStatus = (type: ScreeningComponentType): ScreeningProgressStep["status"] => {
    const row = components.find((c) => c.componentType === type);
    if (!row || row.status === "not_requested") return "skipped";
    if (row.status === "pending") return screeningCase.status.includes("progress") ? "in_progress" : "pending";
    if (row.status === "error" || row.status === "fail") return "failed";
    return "complete";
  };

  return [
    step("consent", "Consent", consentStatus),
    step("identity", "Identity", componentStatus("identity")),
    step("credit", "Credit", componentStatus("credit")),
    step("criminal", "Criminal", componentStatus("criminal")),
    step("eviction", "Eviction", componentStatus("eviction")),
    step("sex_offender", "Sex offender registry", componentStatus("sex_offender")),
    step(
      "review",
      "Review",
      ["ready_for_review", "in_review"].includes(screeningCase.status)
        ? "in_progress"
        : screeningCase.decidedAt
          ? "complete"
          : "pending"
    ),
    step(
      "decision",
      "Decision",
      screeningCase.decision ? "complete" : "pending"
    )
  ];
}

export async function createScreeningCase(
  organizationId: string,
  userId: string,
  input: CreateScreeningCaseInput,
  client?: ScreeningClient
): Promise<ScreeningCaseRecord> {
  const supabase = await resolveClient(client);
  const applicant = await getApplicantLite(organizationId, input.applicantId, supabase);
  if (!applicant) throw new Error("Applicant not found");

  const settings = await getSettings(organizationId, supabase);
  const providerId = input.provider ?? settings.provider;
  const packageCode = input.packageCode ?? settings.packageCode;
  const caseNumber = await generateCaseNumber(organizationId, supabase);
  const expiresAt = new Date(
    Date.now() + settings.reportRetentionDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: caseRow, error } = await supabase
    .from("screening_cases")
    .insert({
      organization_id: organizationId,
      applicant_id: input.applicantId,
      case_number: caseNumber,
      provider: providerId,
      package_code: packageCode,
      status: "awaiting_consent",
      expires_at: expiresAt,
      supersedes_case_id: input.supersedesCaseId ?? null,
      created_by: userId,
      updated_by: userId,
      metadata: {} as Json
    })
    .select("*")
    .single();

  if (error || !caseRow) throw new Error(error?.message ?? "Screening case creation failed");

  const partiesInput =
    input.parties && input.parties.length > 0
      ? input.parties
      : [
          {
            role: "primary" as const,
            fullName: `${applicant.firstName} ${applicant.lastName}`.trim(),
            email: applicant.email,
            phone: applicant.phone,
            applicantId: applicant.id
          }
        ];

  const tokenExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const partyRows = partiesInput.map((party) => ({
    organization_id: organizationId,
    screening_case_id: caseRow.id as string,
    applicant_id: party.applicantId ?? (party.role === "primary" ? applicant.id : null),
    role: party.role,
    full_name: party.fullName,
    email: party.email ?? null,
    phone: party.phone ?? null,
    status: "pending_consent",
    consent_token: randomBytes(24).toString("hex"),
    consent_token_expires_at: tokenExpiry
  }));

  const { data: parties, error: partyError } = await supabase
    .from("screening_parties")
    .insert(partyRows)
    .select("*");
  if (partyError) throw new Error(partyError.message);

  const components = packageComponentsFor(packageCode);
  const componentRows = (parties ?? []).flatMap((party: Record<string, unknown>) =>
    components.map((componentType) => ({
      organization_id: organizationId,
      screening_case_id: caseRow.id as string,
      screening_party_id: party['id'] as string,
      component_type: componentType,
      status: componentType === "income" ? "not_requested" : "pending",
      flags: [] as Json
    }))
  );
  if (componentRows.length > 0) {
    const { error: componentError } = await supabase.from("screening_components").insert(componentRows);
    if (componentError) throw new Error(componentError.message);
  }

  await ensureConsentVersion(organizationId, userId, supabase);

  await writeAudit(
    organizationId,
    caseRow.id as string,
    userId,
    "case_created",
    `Screening case ${caseNumber} created — awaiting consent`,
    { provider: providerId, packageCode },
    supabase
  );

  await recordApplicantEvent(
    organizationId,
    input.applicantId,
    userId,
    "screening_started",
    `Screening ${caseNumber} started — consent required`,
    { screeningCaseId: caseRow.id },
    supabase
  ).catch(() => undefined);

  const primary = (parties ?? []).find((p: Record<string, unknown>) => p['role'] === "primary") ?? parties?.[0];
  if (primary?.email) {
    // Notify PMs that consent is outstanding
    await notifyPm(
      organizationId,
      userId,
      applicant.id,
      `applicant.screening_consent_requested:${caseRow.id}`,
      "Screening consent requested",
      `${applicant.firstName} ${applicant.lastName} — authorize background screening`,
      supabase
    ).catch(() => undefined);
  }

  return mapCase(caseRow as Record<string, unknown>);
}

async function notifyPm(
  organizationId: string,
  actorUserId: string,
  applicantId: string,
  eventKey: string,
  title: string,
  body: string,
  client: ScreeningClient
) {
  const applicant = await getApplicantLite(organizationId, applicantId, client);
  const recipients = new Set<string>();
  if (applicant?.assignedPmId) recipients.add(applicant.assignedPmId);
  if (recipients.size === 0) {
    const { data: memberships } = await client
      .from("organization_memberships")
      .select("user_id, roles")
      .eq("organization_id", organizationId)
      .eq("status", "active");
    for (const row of (memberships ?? []) as Array<{ user_id: string; roles: string[] | null }>) {
      if (Array.isArray(row.roles) && row.roles.includes("property_manager")) {
        recipients.add(row.user_id);
      }
    }
  }
  if (recipients.size === 0) return;
  await notify(
    {
      organizationId,
      actorUserId,
      eventKey,
      recipientUserIds: [...recipients],
      category: "applicants",
      priority: "high",
      title,
      body,
      href: `/applicants/${applicantId}`,
      sourceEntityType: "applicant",
      sourceEntityId: applicantId,
      propertyId: applicant?.propertyId ?? null,
      unitId: applicant?.unitId ?? null
    },
    client
  );
}

export async function getConsentByToken(token: string) {
  const admin = await adminClient();
  const { data: party, error } = await admin
    .from("screening_parties")
    .select("*")
    .eq("consent_token", token)
    .maybeSingle();
  if (error || !party) return null;

  if (
    party.consent_token_expires_at &&
    new Date(party.consent_token_expires_at as string).getTime() < Date.now()
  ) {
    return { expired: true as const, party: mapParty(party as Record<string, unknown>) };
  }

  const organizationId = party.organization_id as string;
  const caseId = party.screening_case_id as string;
  const screeningCase = await getScreeningCase(organizationId, caseId, admin);

  const { data: version } = await admin
    .from("screening_consent_versions")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: existingConsent } = await admin
    .from("screening_consents")
    .select("id")
    .eq("screening_party_id", party.id)
    .maybeSingle();

  return {
    expired: false as const,
    party: mapParty(party as Record<string, unknown>),
    case: screeningCase,
    consentVersion: version,
    alreadyGranted: Boolean(existingConsent)
  };
}

export async function grantConsentByToken(token: string, input: GrantConsentInput) {
  if (!input.attestedDisclosure || !input.attestedAuthorization) {
    throw new Error("Disclosure and authorization must be accepted");
  }
  if (!input.signedName.trim()) throw new Error("Signed name is required");

  const admin = await adminClient();
  const bundle = await getConsentByToken(token);
  if (!bundle || bundle.expired) throw new Error("Consent link is invalid or expired");
  if (bundle.alreadyGranted) throw new Error("Consent already granted");
  if (!bundle.case || !bundle.consentVersion) throw new Error("Screening case not found");

  const organizationId = bundle.party.organizationId;
  const caseId = bundle.party.screeningCaseId;

  const { data: consent, error } = await admin
    .from("screening_consents")
    .insert({
      organization_id: organizationId,
      screening_case_id: caseId,
      screening_party_id: bundle.party.id,
      consent_version_id: (bundle.consentVersion as { id: string }).id,
      signed_name: input.signedName.trim(),
      attested_disclosure: true,
      attested_authorization: true,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null
    })
    .select("*")
    .single();
  if (error || !consent) throw new Error(error?.message ?? "Consent save failed");

  // Vault metadata record for consent (Q3 — original docs in vault)
  let vaultDocumentId: string | null = null;
  const createdBy =
    ((await admin.from("screening_cases").select("created_by").eq("id", caseId).maybeSingle()).data
      ?.created_by as string | undefined) ?? null;
  if (createdBy) {
    try {
      const doc = await createVaultDocument(
        organizationId,
        createdBy,
        {
          entityType: "applicant",
          entityId: bundle.case.applicantId,
          documentType: "screening_consent",
          title: `Screening consent — ${bundle.party.fullName}`,
          notes: `Case ${bundle.case.caseNumber}; version ${(bundle.consentVersion as { version: number }).version}`,
          metadata: {
            screeningCaseId: caseId,
            screeningPartyId: bundle.party.id,
            consentId: consent.id,
            signedName: input.signedName.trim()
          }
        },
        admin
      );
      vaultDocumentId = doc.id;
      await admin
        .from("screening_consents")
        .update({ vault_document_id: vaultDocumentId })
        .eq("id", consent.id);
    } catch {
      // Vault write is best-effort
    }
  }

  await admin
    .from("screening_parties")
    .update({ status: "consent_granted", consent_token: null })
    .eq("id", bundle.party.id)
    .eq("organization_id", organizationId);

  await writeAudit(
    organizationId,
    caseId,
    null,
    "consent_granted",
    `Consent granted by ${input.signedName.trim()}`,
    { partyId: bundle.party.id, consentId: consent.id, vaultDocumentId },
    admin
  );

  // If all parties consented → submit to provider
  const { data: parties } = await admin
    .from("screening_parties")
    .select("*")
    .eq("screening_case_id", caseId)
    .eq("organization_id", organizationId);

  const allGranted = (parties ?? []).every((p: { status: string }) => p.status === "consent_granted");
  if (allGranted) {
    await admin
      .from("screening_cases")
      .update({
        status: "consent_complete",
        consent_completed_at: new Date().toISOString()
      })
      .eq("id", caseId)
      .eq("organization_id", organizationId);

    await submitCaseToProvider(organizationId, caseId, consent.id as string, admin);
  }

  return { consentId: consent.id as string, caseId, submitted: allGranted };
}

export async function submitCaseToProvider(
  organizationId: string,
  caseId: string,
  consentAttestationId: string,
  client?: ScreeningClient
) {
  const supabase = await resolveClient(client);
  const detail = await getScreeningCaseDetail(organizationId, caseId, supabase);
  if (!detail) throw new Error("Screening case not found");
  if (!detail.case.consentCompletedAt && detail.case.status !== "consent_complete") {
    throw new Error("Consent required before provider request");
  }

  const provider = getScreeningProvider(detail.case.provider);
  const components = packageComponentsFor(detail.case.packageCode);

  await supabase
    .from("screening_cases")
    .update({ status: "screening_in_progress", submitted_to_provider_at: new Date().toISOString() })
    .eq("id", caseId)
    .eq("organization_id", organizationId);

  let lastRef: string | null = null;
  for (const party of detail.parties) {
    try {
      const order = await provider.createOrder({
        organizationId,
        screeningCaseId: caseId,
        caseNumber: detail.case.caseNumber,
        packageCode: detail.case.packageCode,
        components,
        consentAttestationId,
        party: {
          id: party.id,
          fullName: party.fullName,
          email: party.email,
          role: party.role,
          externalCandidateId: party.externalCandidateId
        },
        sandbox: true
      });
      lastRef = order.externalReference;
      await supabase
        .from("screening_parties")
        .update({
          status: "screening_in_progress",
          external_candidate_id: order.externalCandidateId ?? null
        })
        .eq("id", party.id);

      // Sandbox/noop: immediately fetch normalized report
      if (
        provider.id === "noop" ||
        order.externalReference.startsWith("checkr-sandbox-") ||
        order.externalReference.startsWith("noop-")
      ) {
        const report = await provider.fetchNormalizedReport(order);
        await applyNormalizedReport(organizationId, caseId, party.id, report, supabase);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Provider order failed";
      await supabase
        .from("screening_cases")
        .update({
          status: "failed",
          last_error: message,
          retry_count: detail.case.retryCount + 1
        })
        .eq("id", caseId);
      await writeAudit(organizationId, caseId, null, "provider_failed", message, {}, supabase);
      throw error;
    }
  }

  if (lastRef) {
    await supabase
      .from("screening_cases")
      .update({ external_reference: lastRef })
      .eq("id", caseId)
      .eq("organization_id", organizationId);
  }

  await writeAudit(
    organizationId,
    caseId,
    null,
    "provider_submitted",
    `Submitted to provider ${provider.id}`,
    { externalReference: lastRef },
    supabase
  );
}

async function applyNormalizedReport(
  organizationId: string,
  caseId: string,
  partyId: string,
  report: NormalizedScreeningReport,
  client: ScreeningClient
) {
  for (const component of report.components) {
    await client
      .from("screening_components")
      .update({
        status: component.status,
        flags: component.flags as unknown as Json,
        summary: component.summary ?? null,
        provider_reference: component.providerReference ?? report.externalReference,
        completed_at: component.completedAt ?? report.completedAt ?? new Date().toISOString()
      })
      .eq("screening_case_id", caseId)
      .eq("screening_party_id", partyId)
      .eq("component_type", component.type)
      .eq("organization_id", organizationId);
  }

  // Vault placeholder for original report artifact (Q3)
  const screeningCase = await getScreeningCase(organizationId, caseId, client);
  if (screeningCase && report.rawArtifactHints?.length) {
    try {
      const { data: caseMeta } = await client
        .from("screening_cases")
        .select("created_by")
        .eq("id", caseId)
        .maybeSingle();
      const createdBy = caseMeta?.created_by as string | undefined;
      if (createdBy) {
        await createVaultDocument(
          organizationId,
          createdBy,
          {
            entityType: "applicant",
            entityId: screeningCase.applicantId,
            documentType: "screening_report",
            title: `Screening report — ${screeningCase.caseNumber}`,
            notes: report.resultSummary,
            metadata: {
              screeningCaseId: caseId,
              providerReference: report.externalReference,
              artifact: report.rawArtifactHints[0]
            }
          },
          client
        );
      }
    } catch {
      // ignore vault failures for system paths
    }
  }

  await client
    .from("screening_parties")
    .update({ status: "ready" })
    .eq("id", partyId)
    .eq("organization_id", organizationId);

  const { data: parties } = await client
    .from("screening_parties")
    .select("status")
    .eq("screening_case_id", caseId)
    .eq("organization_id", organizationId);

  const allReady = (parties ?? []).every((p: { status: string }) => p.status === "ready" || p.status === "cancelled");
  if (allReady) {
    const hasFlags = report.components.some((c) => c.status === "review" || c.status === "fail");
    await client
      .from("screening_cases")
      .update({
        status: "ready_for_review",
        ready_for_review_at: new Date().toISOString(),
        result_summary: report.resultSummary,
        normalized_summary: {
          components: report.components,
          externalReference: report.externalReference,
          flagged: hasFlags
        } as Json,
        external_reference: report.externalReference,
        expires_at: report.expiresAt ?? undefined
      })
      .eq("id", caseId)
      .eq("organization_id", organizationId);

    await writeAudit(
      organizationId,
      caseId,
      null,
      "ready_for_review",
      "Screening results ready for property manager review",
      { externalReference: report.externalReference },
      client
    );

    if (screeningCase) {
      await recordApplicantEvent(
        organizationId,
        screeningCase.applicantId,
        screeningCase.applicantId,
        "screening_completed",
        `Screening ${screeningCase.caseNumber} ready for review`,
        { screeningCaseId: caseId },
        client
      ).catch(() => undefined);

      await notifyPm(
        organizationId,
        screeningCase.applicantId,
        screeningCase.applicantId,
        `applicant.screening_ready:${caseId}`,
        "Screening ready for review",
        report.resultSummary,
        client
      ).catch(() => undefined);
    }
  }
}

export async function applyProviderWebhook(
  providerId: string,
  payload: unknown,
  headers: Record<string, string>
) {
  const admin = await adminClient();
  const provider = getScreeningProvider(providerId);
  const result = await provider.handleWebhook(payload, headers);

  const { error: insertError } = await admin.from("integrations_webhook_events").insert({
    provider: providerId,
    external_event_id: result.externalEventId,
    payload: payload as Json,
    headers: headers as unknown as Json,
    status: result.ignored ? "ignored" : "received"
  });

  // Unique violation = already processed
  if (insertError && !insertError.message.toLowerCase().includes("duplicate")) {
    throw new Error(insertError.message);
  }
  if (insertError) {
    return { duplicate: true, result };
  }

  if (result.ignored || !result.screeningExternalReference || !result.normalized) {
    await admin
      .from("integrations_webhook_events")
      .update({ status: "ignored", processed_at: new Date().toISOString() })
      .eq("provider", providerId)
      .eq("external_event_id", result.externalEventId);
    return { duplicate: false, result };
  }

  const { data: caseRow } = await admin
    .from("screening_cases")
    .select("*")
    .eq("external_reference", result.screeningExternalReference)
    .maybeSingle();

  if (!caseRow) {
    // Try prefix match for multi-party sandbox refs
    const { data: cases } = await admin
      .from("screening_cases")
      .select("*")
      .ilike("external_reference", `%${result.screeningExternalReference}%`)
      .limit(1);
    const matched = cases?.[0];
    if (!matched) {
      await admin
        .from("integrations_webhook_events")
        .update({ status: "failed", error_message: "Case not found", processed_at: new Date().toISOString() })
        .eq("provider", providerId)
        .eq("external_event_id", result.externalEventId);
      return { duplicate: false, result };
    }
    const parties = await admin
      .from("screening_parties")
      .select("id")
      .eq("screening_case_id", matched.id)
      .limit(1);
    const partyId = parties.data?.[0]?.id as string;
    await applyNormalizedReport(
      matched.organization_id as string,
      matched.id as string,
      partyId,
      result.normalized,
      admin
    );
  } else {
    const { data: party } = await admin
      .from("screening_parties")
      .select("id")
      .eq("screening_case_id", caseRow.id)
      .limit(1)
      .maybeSingle();
    if (party) {
      await applyNormalizedReport(
        caseRow.organization_id as string,
        caseRow.id as string,
        party['id'] as string,
        result.normalized,
        admin
      );
    }
  }

  await admin
    .from("integrations_webhook_events")
    .update({
      status: "processed",
      processed_at: new Date().toISOString(),
      organization_id: caseRow?.organization_id ?? null
    })
    .eq("provider", providerId)
    .eq("external_event_id", result.externalEventId);

  return { duplicate: false, result };
}

export async function recordDecision(
  organizationId: string,
  caseId: string,
  userId: string,
  input: RecordDecisionInput,
  client?: ScreeningClient
) {
  const supabase = await resolveClient(client);
  const screeningCase = await getScreeningCase(organizationId, caseId, supabase);
  if (!screeningCase) throw new Error("Screening case not found");
  if (screeningCase.expiresAt && new Date(screeningCase.expiresAt).getTime() < Date.now()) {
    throw new Error("Screening report expired — re-screen required");
  }
  if (!["ready_for_review", "in_review", "adverse_action_pending"].includes(screeningCase.status)) {
    throw new Error(`Cannot decide case in status ${screeningCase.status}`);
  }

  // Q4: human decision only — no AI path here
  const { data: decision, error } = await supabase
    .from("screening_decisions")
    .upsert(
      {
        organization_id: organizationId,
        screening_case_id: caseId,
        decision: input.decision,
        reason_codes: input.reasonCodes ?? [],
        notes: input.notes ?? null,
        decided_by: userId,
        decided_at: new Date().toISOString()
      },
      { onConflict: "screening_case_id" }
    )
    .select("*")
    .single();
  if (error || !decision) throw new Error(error?.message ?? "Decision save failed");

  if (input.decision === "conditional" && input.conditions?.length) {
    await supabase.from("screening_conditions").insert(
      input.conditions.map((condition) => ({
        organization_id: organizationId,
        screening_case_id: caseId,
        decision_id: decision.id,
        condition_type: condition.conditionType,
        description: condition.description,
        due_at: condition.dueAt ?? null,
        status: "open"
      }))
    );
  }

  const settings = await getSettings(organizationId, supabase);
  let nextStatus: ScreeningCaseStatus =
    input.decision === "approve"
      ? "approved"
      : input.decision === "conditional"
        ? "conditionally_approved"
        : "rejected";

  if (input.decision === "reject" && settings.adverseActionRequired) {
    nextStatus = "adverse_action_pending";
    await startAdverseAction(organizationId, caseId, userId, "pre_adverse", supabase);
  }

  await supabase
    .from("screening_cases")
    .update({
      status: nextStatus,
      decision: input.decision,
      decided_at: new Date().toISOString(),
      updated_by: userId
    })
    .eq("id", caseId)
    .eq("organization_id", organizationId);

  await writeAudit(
    organizationId,
    caseId,
    userId,
    "decision_recorded",
    `Decision: ${input.decision}`,
    { reasonCodes: input.reasonCodes ?? [], notes: input.notes ?? null },
    supabase
  );

  await recordApplicantEvent(
    organizationId,
    screeningCase.applicantId,
    userId,
    input.decision === "approve" || input.decision === "conditional"
      ? "screening_completed"
      : "screening_completed",
    `Screening decision: ${input.decision}`,
    { screeningCaseId: caseId, decision: input.decision },
    supabase
  ).catch(() => undefined);

  return { decision, status: nextStatus };
}

export async function startAdverseAction(
  organizationId: string,
  caseId: string,
  userId: string,
  stage: "pre_adverse" | "final_adverse",
  client?: ScreeningClient
) {
  const supabase = await resolveClient(client);
  const settings = await getSettings(organizationId, supabase);
  const waitUntil =
    stage === "pre_adverse"
      ? new Date(Date.now() + settings.adverseActionWaitHours * 60 * 60 * 1000).toISOString()
      : null;

  const noticeBody =
    stage === "pre_adverse"
      ? "Pre-adverse action notice: A consumer report may adversely affect your rental application. You may dispute inaccurate information with the consumer reporting agency."
      : "Final adverse action notice: Your rental application was not approved based in whole or in part on information in a consumer report. You have the right to obtain a free copy of the report and to dispute its accuracy.";

  const { data, error } = await supabase
    .from("screening_adverse_actions")
    .insert({
      organization_id: organizationId,
      screening_case_id: caseId,
      stage,
      status: "sent",
      notice_body: noticeBody,
      sent_at: new Date().toISOString(),
      wait_until: waitUntil,
      created_by: userId
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Adverse action create failed");

  const screeningCase = await getScreeningCase(organizationId, caseId, supabase);
  if (screeningCase) {
    try {
      const doc = await createVaultDocument(
        organizationId,
        userId,
        {
          entityType: "applicant",
          entityId: screeningCase.applicantId,
          documentType: "screening_adverse_action",
          title: `${stage === "pre_adverse" ? "Pre-adverse" : "Adverse"} action — ${screeningCase.caseNumber}`,
          notes: noticeBody,
          metadata: { screeningCaseId: caseId, stage, adverseActionId: data.id }
        },
        supabase
      );
      await supabase
        .from("screening_adverse_actions")
        .update({ vault_document_id: doc.id })
        .eq("id", data.id);
    } catch {
      // ignore
    }
  }

  await writeAudit(
    organizationId,
    caseId,
    userId,
    "adverse_action_sent",
    `${stage} notice sent`,
    { adverseActionId: data.id, waitUntil },
    supabase
  );

  return data;
}

export async function completeAdverseAction(
  organizationId: string,
  caseId: string,
  userId: string,
  client?: ScreeningClient
) {
  const supabase = await resolveClient(client);
  const settings = await getSettings(organizationId, supabase);

  const { data: pre } = await supabase
    .from("screening_adverse_actions")
    .select("*")
    .eq("screening_case_id", caseId)
    .eq("stage", "pre_adverse")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pre?.wait_until && new Date(pre.wait_until as string).getTime() > Date.now()) {
    throw new Error("Adverse action waiting period has not elapsed");
  }

  await startAdverseAction(organizationId, caseId, userId, "final_adverse", supabase);

  await supabase
    .from("screening_cases")
    .update({ status: "adverse_action_complete", updated_by: userId })
    .eq("id", caseId)
    .eq("organization_id", organizationId);

  if (pre) {
    await supabase
      .from("screening_adverse_actions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", pre.id);
  }

  await writeAudit(
    organizationId,
    caseId,
    userId,
    "adverse_action_complete",
    "Final adverse action completed",
    { waitHours: settings.adverseActionWaitHours },
    supabase
  );
}

export async function linkLeaseToScreening(
  organizationId: string,
  caseId: string,
  leaseId: string,
  userId: string,
  client?: ScreeningClient
) {
  const supabase = await resolveClient(client);
  const screeningCase = await getScreeningCase(organizationId, caseId, supabase);
  if (!screeningCase) throw new Error("Screening case not found");
  if (!["approved", "conditionally_approved"].includes(screeningCase.status)) {
    throw new Error("Only approved or conditionally approved cases can hand off to lease");
  }
  if (screeningCase.expiresAt && new Date(screeningCase.expiresAt).getTime() < Date.now()) {
    throw new Error("Screening expired — re-screen before lease generation");
  }

  const { data: openConditions } = await supabase
    .from("screening_conditions")
    .select("id")
    .eq("screening_case_id", caseId)
    .eq("status", "open");
  if ((openConditions ?? []).length > 0 && screeningCase.status === "conditionally_approved") {
    throw new Error("Open screening conditions must be satisfied before lease handoff");
  }

  await supabase
    .from("screening_cases")
    .update({ lease_id: leaseId, updated_by: userId })
    .eq("id", caseId)
    .eq("organization_id", organizationId);

  await writeAudit(
    organizationId,
    caseId,
    userId,
    "lease_handoff",
    `Linked lease ${leaseId}`,
    { leaseId },
    supabase
  );

  return getScreeningCase(organizationId, caseId, supabase);
}

export async function retryProviderSubmission(
  organizationId: string,
  caseId: string,
  userId: string,
  client?: ScreeningClient
) {
  const supabase = await resolveClient(client);
  const screeningCase = await getScreeningCase(organizationId, caseId, supabase);
  if (!screeningCase) throw new Error("Case not found");
  if (!screeningCase.consentCompletedAt) throw new Error("Consent required");

  const { data: consent } = await supabase
    .from("screening_consents")
    .select("id")
    .eq("screening_case_id", caseId)
    .limit(1)
    .maybeSingle();
  if (!consent) throw new Error("Consent record missing");

  await supabase
    .from("screening_cases")
    .update({ last_error: null, status: "consent_complete" })
    .eq("id", caseId);

  await submitCaseToProvider(organizationId, caseId, consent.id as string, supabase);
  await writeAudit(organizationId, caseId, userId, "provider_retry", "Provider submission retried", {}, supabase);
}

export async function expireDueScreeningCases(client?: ScreeningClient) {
  const supabase = client ?? (await adminClient());
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("screening_cases")
    .select("id, organization_id")
    .lt("expires_at", now)
    .not("status", "in", '("expired","cancelled","rejected","adverse_action_complete")');

  for (const row of data ?? []) {
    await supabase
      .from("screening_cases")
      .update({ status: "expired" })
      .eq("id", row.id);
    await writeAudit(
      row.organization_id as string,
      row.id as string,
      null,
      "expired",
      "Screening case expired by retention policy",
      {},
      supabase
    );
  }
  return { expired: data?.length ?? 0 };
}

export async function getScreeningOpsSnapshot(
  organizationId: string,
  client?: ScreeningClient
): Promise<ScreeningOpsSnapshot> {
  const supabase = await resolveClient(client);
  const { data: cases } = await supabase
    .from("screening_cases")
    .select("status, ready_for_review_at, consent_completed_at, created_at, normalized_summary, decided_at")
    .eq("organization_id", organizationId);

  const rows = cases ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const pending = rows.filter((r: Record<string, unknown>) =>
    ["draft", "awaiting_consent", "consent_complete", "identity_in_progress", "screening_in_progress", "partial_results"].includes(
      String(r['status'])
    )
  ).length;
  const awaitingConsent = rows.filter((r: Record<string, unknown>) => r['status'] === "awaiting_consent").length;
  const ready = rows.filter((r: Record<string, unknown>) => r['status'] === "ready_for_review" || r['status'] === "in_review").length;
  const failures = rows.filter((r: Record<string, unknown>) => r['status'] === "failed").length;
  const completedToday = rows.filter(
    (r: Record<string, unknown>) => r['decided_at'] && String(r['decided_at']).startsWith(today)
  ).length;
  const flagged = rows.filter((r: Record<string, unknown>) => {
    const summary = r['normalized_summary'] as { flagged?: boolean } | null;
    return Boolean(summary?.flagged) || r['status'] === "ready_for_review";
  }).length;

  const turnarounds: number[] = [];
  for (const row of rows) {
    if (row.consent_completed_at && row.ready_for_review_at) {
      const hours =
        (new Date(row.ready_for_review_at as string).getTime() -
          new Date(row.consent_completed_at as string).getTime()) /
        (1000 * 60 * 60);
      if (Number.isFinite(hours) && hours >= 0) turnarounds.push(hours);
    }
  }
  const averageTurnaroundHours =
    turnarounds.length > 0
      ? Math.round((turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length) * 10) / 10
      : null;

  return {
    pendingScreenings: pending,
    awaitingConsent: awaitingConsent,
    readyForReview: ready,
    flaggedApplicants: flagged,
    providerFailures: failures,
    completedToday,
    averageTurnaroundHours
  };
}

export async function addScreeningParty(
  organizationId: string,
  caseId: string,
  userId: string,
  party: {
    role: ScreeningPartyRole;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    applicantId?: string | null;
  },
  client?: ScreeningClient
) {
  const supabase = await resolveClient(client);
  const screeningCase = await getScreeningCase(organizationId, caseId, supabase);
  if (!screeningCase) throw new Error("Case not found");
  if (!["draft", "awaiting_consent"].includes(screeningCase.status)) {
    throw new Error("Parties can only be added before provider submission");
  }

  const tokenExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("screening_parties")
    .insert({
      organization_id: organizationId,
      screening_case_id: caseId,
      applicant_id: party.applicantId ?? null,
      role: party.role,
      full_name: party.fullName,
      email: party.email ?? null,
      phone: party.phone ?? null,
      status: "pending_consent",
      consent_token: randomBytes(24).toString("hex"),
      consent_token_expires_at: tokenExpiry
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Party create failed");

  const components = packageComponentsFor(screeningCase.packageCode);
  await supabase.from("screening_components").insert(
    components.map((componentType) => ({
      organization_id: organizationId,
      screening_case_id: caseId,
      screening_party_id: data.id,
      component_type: componentType,
      status: componentType === "income" ? "not_requested" : "pending",
      flags: [] as Json
    }))
  );

  await writeAudit(
    organizationId,
    caseId,
    userId,
    "party_added",
    `Added ${party.role}: ${party.fullName}`,
    { partyId: data.id },
    supabase
  );

  return mapParty(data as Record<string, unknown>);
}

export async function auditScreeningAccess(
  organizationId: string,
  caseId: string,
  userId: string,
  accessType: "view_summary" | "view_full" | "download",
  client?: ScreeningClient
) {
  const supabase = await resolveClient(client);
  await writeAudit(
    organizationId,
    caseId,
    userId,
    "access",
    `Screening ${accessType}`,
    { accessType },
    supabase
  );
}
