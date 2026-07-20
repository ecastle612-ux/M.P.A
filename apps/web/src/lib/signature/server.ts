/**
 * SignatureService — sole domain entry for API-004.
 * Never call SignatureProvider from UI or other business modules.
 */
import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@mpa/supabase";
import { createAuthServerComponentClient, createServiceRoleServerClient } from "../auth/server";
import { getSignatureProvider, resolveDefaultSignatureProviderId } from "../integrations/signature/registry";
import type { EnvelopeRef } from "../integrations/signature/contracts";
import { notify } from "../notifications/service";
import { createVaultDocument } from "../vault/server";
import { recordApplicantEvent } from "../applicant/events";
import { generateDocumentFromTemplate } from "./document-generation";
import {
  buildProgress,
  type CreateSignaturePackageInput,
  type MergeFieldContext,
  type SignatureDocumentType,
  type SignatureOpsSnapshot,
  type SignatureOrderMode,
  type SignaturePackageDocumentRecord,
  type SignaturePackageRecord,
  type SignaturePackageStatus,
  type SignatureRecipientRecord,
  type SignatureRecipientRole,
  type SignatureVaultStatus
} from "./contracts";

// API-004 tables may not yet be in generated Database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SignatureClient = any;

async function resolveClient(client?: SupabaseClient<Database>): Promise<SignatureClient> {
  return client ?? (await createAuthServerComponentClient());
}

async function adminClient(): Promise<SignatureClient> {
  return createServiceRoleServerClient() as SignatureClient;
}

function appUrl(): string {
  return process.env["NEXT_PUBLIC_APP_URL"]?.replace(/\/$/, "") || "http://localhost:3000";
}

function mapPackage(row: Record<string, unknown>): SignaturePackageRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    applicantId: (row["applicant_id"] as string | null) ?? null,
    leaseId: (row["lease_id"] as string | null) ?? null,
    propertyId: (row["property_id"] as string | null) ?? null,
    unitId: (row["unit_id"] as string | null) ?? null,
    tenantId: (row["tenant_id"] as string | null) ?? null,
    screeningCaseId: (row["screening_case_id"] as string | null) ?? null,
    packageNumber: String(row["request_number"]),
    provider: String(row["provider"]),
    documentType: String(row["request_type"]) as SignatureDocumentType,
    status: String(row["status"]) as SignaturePackageStatus,
    orderMode: String(row["order_mode"] ?? "sequential") as SignatureOrderMode,
    subject: (row["subject"] as string | null) ?? null,
    message: (row["message"] as string | null) ?? null,
    externalReference: (row["external_reference"] as string | null) ?? null,
    expiresAt: (row["expires_at"] as string | null) ?? null,
    sentAt: (row["sent_at"] as string | null) ?? null,
    completedAt: (row["completed_at"] as string | null) ?? null,
    cancelledAt: (row["cancelled_at"] as string | null) ?? null,
    signedAt: (row["signed_at"] as string | null) ?? null,
    vaultStatus: String(row["vault_status"] ?? "not_required") as SignatureVaultStatus,
    vaultRetryCount: Number(row["vault_retry_count"] ?? 0),
    vaultLastError: (row["vault_last_error"] as string | null) ?? null,
    residentActivatedAt: (row["resident_activated_at"] as string | null) ?? null,
    certificateVaultDocumentId: (row["certificate_vault_document_id"] as string | null) ?? null,
    lastError: (row["last_error"] as string | null) ?? null,
    retryCount: Number(row["retry_count"] ?? 0),
    metadata: (row["metadata"] as Record<string, unknown>) ?? {},
    createdAt: String(row["created_at"]),
    updatedAt: String(row["updated_at"])
  };
}

function mapRecipient(row: Record<string, unknown>): SignatureRecipientRecord {
  const token = (row["progress_token"] as string | null) ?? null;
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    signatureRequestId: String(row["signature_request_id"]),
    role: String(row["role"]) as SignatureRecipientRole,
    fullName: String(row["full_name"]),
    email: (row["email"] as string | null) ?? null,
    userId: (row["user_id"] as string | null) ?? null,
    applicantId: (row["applicant_id"] as string | null) ?? null,
    tenantId: (row["tenant_id"] as string | null) ?? null,
    signingOrder: Number(row["signing_order"] ?? 1),
    signingGroup: Number(row["signing_group"] ?? 1),
    isRequired: Boolean(row["is_required"] ?? true),
    authMethod: String(row["auth_method"] ?? "email"),
    status: String(row["status"]) as SignatureRecipientRecord["status"],
    progressToken: token,
    signingUrl: (row["signing_url"] as string | null) ?? null,
    externalRecipientId: (row["external_recipient_id"] as string | null) ?? null,
    invitedAt: (row["invited_at"] as string | null) ?? null,
    viewedAt: (row["viewed_at"] as string | null) ?? null,
    signedAt: (row["signed_at"] as string | null) ?? null,
    declinedAt: (row["declined_at"] as string | null) ?? null,
    lastReminderAt: (row["last_reminder_at"] as string | null) ?? null,
    reminderCount: Number(row["reminder_count"] ?? 0),
    progressUrl: token ? `${appUrl()}/signing/progress/${token}` : null
  };
}

function mapDocument(row: Record<string, unknown>): SignaturePackageDocumentRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    signatureRequestId: String(row["signature_request_id"]),
    templateId: (row["template_id"] as string | null) ?? null,
    documentType: String(row["document_type"]),
    title: String(row["title"]),
    version: Number(row["version"] ?? 1),
    contentHash: String(row["content_hash"]),
    contentText: String(row["content_text"]),
    isPreview: Boolean(row["is_preview"]),
    sortOrder: Number(row["sort_order"] ?? 0),
    vaultDocumentId: (row["vault_document_id"] as string | null) ?? null
  };
}

async function writeAudit(
  organizationId: string,
  packageId: string,
  eventType: string,
  summary: string,
  actorUserId: string | null,
  payload: Record<string, unknown> = {},
  client?: SignatureClient,
  extras: { recipientId?: string | null; ipAddress?: string | null; userAgent?: string | null } = {}
) {
  const supabase = client ?? (await adminClient());
  await supabase.from("signature_audit_events").insert({
    organization_id: organizationId,
    signature_request_id: packageId,
    recipient_id: extras.recipientId ?? null,
    actor_user_id: actorUserId,
    event_type: eventType,
    summary,
    ip_address: extras.ipAddress ?? null,
    user_agent: extras.userAgent ?? null,
    payload: payload as Json
  });
}

async function generatePackageNumber(organizationId: string, client: SignatureClient): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `SIG-${year}`;
  const { count } = await client
    .from("signature_requests")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  return `${prefix}-${String((count ?? 0) + 1).padStart(5, "0")}`;
}

async function getSettings(organizationId: string, client: SignatureClient) {
  const { data } = await client
    .from("organization_signature_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  return (
    data ?? {
      provider: resolveDefaultSignatureProviderId(),
      default_order_mode: "sequential",
      pm_countersign: "required_last",
      owner_required: false,
      expiration_days: 14,
      max_reminders: 3,
      activate_resident_on_complete: true
    }
  );
}

async function buildLeaseMergeContext(
  organizationId: string,
  leaseId: string,
  client: SignatureClient
): Promise<{ context: MergeFieldContext; lease: Record<string, unknown>; propertyId: string | null; unitId: string | null; applicantHint: string | null }> {
  const { data: lease, error } = await client
    .from("leases")
    .select("*, properties(name, address_line_1, city, state, postal_code), units(unit_number), tenants(first_name, last_name, email)")
    .eq("organization_id", organizationId)
    .eq("id", leaseId)
    .maybeSingle();
  if (error || !lease) throw new Error(error?.message ?? "Lease not found");

  const { data: org } = await client.from("organizations").select("name").eq("id", organizationId).maybeSingle();
  const property = lease.properties as Record<string, unknown> | null;
  const unit = lease.units as Record<string, unknown> | null;
  const tenant = lease.tenants as Record<string, unknown> | null;
  const address = [property?.["address_line_1"], property?.["city"], property?.["state"], property?.["postal_code"]]
    .filter(Boolean)
    .join(", ");

  return {
    lease: lease as Record<string, unknown>,
    propertyId: (lease.property_id as string | null) ?? null,
    unitId: (lease.unit_id as string | null) ?? null,
    applicantHint: null,
    context: {
      property_name: (property?.["name"] as string) ?? "Property",
      property_address: address || "Address on file",
      unit_number: (unit?.["unit_number"] as string) ?? "—",
      org_name: (org?.name as string) ?? "Organization",
      primary_name: tenant
        ? `${tenant["first_name"] ?? ""} ${tenant["last_name"] ?? ""}`.trim()
        : "Resident",
      primary_email: (tenant?.["email"] as string) ?? "",
      lease_start: String(lease.start_date ?? ""),
      lease_end: String(lease.end_date ?? ""),
      rent_amount: lease.rent_amount != null ? `$${lease.rent_amount}` : "",
      deposit_amount: lease.security_deposit != null ? `$${lease.security_deposit}` : ""
    }
  };
}

export async function listSignaturePackages(
  organizationId: string,
  filters: { applicantId?: string; leaseId?: string; status?: string } = {},
  client?: SignatureClient
): Promise<SignaturePackageRecord[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("signature_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (filters.applicantId) query = query.eq("applicant_id", filters.applicantId);
  if (filters.leaseId) query = query.eq("lease_id", filters.leaseId);
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => mapPackage(row));
}

export async function getSignaturePackageDetail(
  organizationId: string,
  packageId: string,
  client?: SignatureClient
) {
  const supabase = await resolveClient(client);
  const { data: row, error } = await supabase
    .from("signature_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", packageId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const [{ data: recipients }, { data: documents }, { data: audit }] = await Promise.all([
    supabase
      .from("signature_recipients")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("signature_request_id", packageId)
      .order("signing_order", { ascending: true }),
    supabase
      .from("signature_package_documents")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("signature_request_id", packageId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("signature_audit_events")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("signature_request_id", packageId)
      .order("created_at", { ascending: false })
      .limit(50)
  ]);

  const pkg = mapPackage(row as Record<string, unknown>);
  const recipientRecords = (recipients ?? []).map((r: Record<string, unknown>) => mapRecipient(r));
  return {
    package: pkg,
    recipients: recipientRecords,
    documents: (documents ?? []).map((d: Record<string, unknown>) => mapDocument(d)),
    audit: audit ?? [],
    progress: buildProgress(pkg, recipientRecords)
  };
}

export async function createSignaturePackage(
  organizationId: string,
  userId: string,
  input: CreateSignaturePackageInput,
  client?: SignatureClient
): Promise<SignaturePackageRecord> {
  const supabase = await resolveClient(client);
  const settings = await getSettings(organizationId, supabase);
  const providerId = input.provider ?? settings.provider ?? resolveDefaultSignatureProviderId();
  const packageNumber = await generatePackageNumber(organizationId, supabase);
  const documentType = (input.documentType ?? "lease_agreement") as SignatureDocumentType;
  const orderMode = (input.orderMode ?? settings.default_order_mode ?? "sequential") as SignatureOrderMode;

  let propertyId: string | null = null;
  let unitId: string | null = null;
  const applicantId = input.applicantId ?? null;
  let mergeContext: MergeFieldContext = {
    property_name: "Property",
    property_address: "Address on file",
    unit_number: "—",
    org_name: "Organization",
    primary_name: "Resident",
    primary_email: "",
    lease_start: "",
    lease_end: "",
    rent_amount: "",
    deposit_amount: ""
  };

  if (input.leaseId) {
    const leaseCtx = await buildLeaseMergeContext(organizationId, input.leaseId, supabase);
    mergeContext = leaseCtx.context;
    propertyId = leaseCtx.propertyId;
    unitId = leaseCtx.unitId;
  } else if (applicantId) {
    const { data: applicant } = await supabase
      .from("applicants")
      .select("id, first_name, last_name, email, property_id, unit_id, properties(name, address_line_1, city, state, postal_code), units(unit_number)")
      .eq("organization_id", organizationId)
      .eq("id", applicantId)
      .maybeSingle();
    if (applicant) {
      propertyId = applicant.property_id;
      unitId = applicant.unit_id;
      const property = applicant.properties as Record<string, unknown> | null;
      const unit = applicant.units as Record<string, unknown> | null;
      mergeContext = {
        ...mergeContext,
        property_name: (property?.["name"] as string) ?? "Property",
        property_address: [property?.["address_line_1"], property?.["city"], property?.["state"], property?.["postal_code"]]
          .filter(Boolean)
          .join(", "),
        unit_number: (unit?.["unit_number"] as string) ?? "—",
        primary_name: `${applicant.first_name} ${applicant.last_name}`.trim(),
        primary_email: applicant.email
      };
    }
  }

  const expiresAt = new Date(
    Date.now() + Number(settings.expiration_days ?? 14) * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: created, error } = await supabase
    .from("signature_requests")
    .insert({
      organization_id: organizationId,
      applicant_id: applicantId,
      lease_id: input.leaseId ?? null,
      property_id: propertyId,
      unit_id: unitId,
      screening_case_id: input.screeningCaseId ?? null,
      request_number: packageNumber,
      provider: providerId,
      request_type: documentType,
      status: "draft",
      order_mode: orderMode,
      subject: input.subject ?? `Please sign: ${documentType.replaceAll("_", " ")}`,
      message: input.message ?? null,
      expires_at: expiresAt,
      vault_status: "not_required",
      metadata: { mergeContext } as Json,
      created_by: userId,
      updated_by: userId
    })
    .select("*")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Package create failed");

  const pkg = mapPackage(created as Record<string, unknown>);

  // Recipients
  const recipients =
    input.recipients && input.recipients.length > 0
      ? input.recipients
      : [
          {
            role: "primary_applicant" as const,
            fullName: String(mergeContext['primary_name'] || "Primary signer"),
            email: String(mergeContext['primary_email'] || "") || null,
            signingOrder: 1,
            signingGroup: 1,
            isRequired: true,
            applicantId
          }
        ];

  if (settings.pm_countersign === "required_last") {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name, contact_email")
      .eq("user_id", userId)
      .maybeSingle();
    recipients.push({
      role: "property_manager",
      fullName: (profile?.display_name as string) || "Property Manager",
      email: (profile?.contact_email as string | null) ?? null,
      signingOrder: recipients.length + 1,
      signingGroup: recipients.length + 1,
      isRequired: true,
      userId
    });
  }

  for (const recipient of recipients) {
    const token = randomBytes(24).toString("hex");
    await supabase.from("signature_recipients").insert({
      organization_id: organizationId,
      signature_request_id: pkg.id,
      role: recipient.role,
      full_name: recipient.fullName,
      email: recipient.email ?? null,
      user_id: recipient.userId ?? null,
      applicant_id: recipient.applicantId ?? null,
      tenant_id: recipient.tenantId ?? null,
      signing_order: recipient.signingOrder ?? 1,
      signing_group: recipient.signingGroup ?? recipient.signingOrder ?? 1,
      is_required: recipient.isRequired ?? recipient.role !== "cc_viewer",
      status: "pending",
      progress_token: token,
      progress_token_expires_at: expiresAt
    });
  }

  // Generate document (Slice 1)
  const generated = generateDocumentFromTemplate({
    title: pkg.subject ?? "Agreement",
    documentType,
    context: mergeContext,
    preview: true
  });

  await supabase.from("signature_package_documents").insert({
    organization_id: organizationId,
    signature_request_id: pkg.id,
    document_type: documentType,
    title: generated.title,
    version: generated.version,
    content_hash: generated.contentHash,
    content_text: generated.contentText,
    content_base64: generated.contentBase64,
    is_preview: true,
    sort_order: 0
  });

  const nextStatus = generated.missingFields.length === 0 ? "ready_to_send" : "draft";
  await supabase
    .from("signature_requests")
    .update({
      status: nextStatus,
      metadata: { mergeContext, missingFields: generated.missingFields } as Json,
      updated_by: userId
    })
    .eq("id", pkg.id)
    .eq("organization_id", organizationId);

  await writeAudit(
    organizationId,
    pkg.id,
    "signature.package.created",
    `Signature package ${packageNumber} created`,
    userId,
    { documentType, missingFields: generated.missingFields },
    supabase
  );

  if (applicantId) {
    await recordApplicantEvent(
      organizationId,
      applicantId,
      userId,
      "signature_requested",
      `Signature package ${packageNumber} created`,
      { packageId: pkg.id, packageNumber },
      supabase
    );
  }

  const detail = await getSignaturePackageDetail(organizationId, pkg.id, supabase);
  return detail!.package;
}

export async function regeneratePreview(
  organizationId: string,
  packageId: string,
  userId: string,
  client?: SignatureClient
) {
  const supabase = await resolveClient(client);
  const detail = await getSignaturePackageDetail(organizationId, packageId, supabase);
  if (!detail) throw new Error("Package not found");
  if (!["draft", "ready_to_send"].includes(detail.package.status)) {
    throw new Error("Preview can only be regenerated before send");
  }

  const mergeContext = (detail.package.metadata["mergeContext"] as MergeFieldContext) ?? {};
  const generated = generateDocumentFromTemplate({
    title: detail.package.subject ?? "Agreement",
    documentType: detail.package.documentType,
    context: mergeContext,
    preview: true
  });

  await supabase
    .from("signature_package_documents")
    .delete()
    .eq("organization_id", organizationId)
    .eq("signature_request_id", packageId);

  await supabase.from("signature_package_documents").insert({
    organization_id: organizationId,
    signature_request_id: packageId,
    document_type: detail.package.documentType,
    title: generated.title,
    version: generated.version,
    content_hash: generated.contentHash,
    content_text: generated.contentText,
    content_base64: generated.contentBase64,
    is_preview: true,
    sort_order: 0
  });

  const nextStatus = generated.missingFields.length === 0 ? "ready_to_send" : "draft";
  await supabase
    .from("signature_requests")
    .update({
      status: nextStatus,
      metadata: { ...detail.package.metadata, missingFields: generated.missingFields } as Json,
      updated_by: userId
    })
    .eq("id", packageId)
    .eq("organization_id", organizationId);

  await writeAudit(
    organizationId,
    packageId,
    "signature.document.previewed",
    "Document preview regenerated",
    userId,
    { contentHash: generated.contentHash, missingFields: generated.missingFields },
    supabase
  );

  return getSignaturePackageDetail(organizationId, packageId, supabase);
}

export async function sendSignaturePackage(
  organizationId: string,
  packageId: string,
  userId: string,
  client?: SignatureClient
) {
  const supabase = await resolveClient(client);
  const detail = await getSignaturePackageDetail(organizationId, packageId, supabase);
  if (!detail) throw new Error("Package not found");
  if (!["draft", "ready_to_send", "failed"].includes(detail.package.status)) {
    throw new Error("Package cannot be sent in its current status");
  }
  if (detail.documents.length === 0) throw new Error("No documents attached");
  if (detail.recipients.filter((r: SignatureRecipientRecord) => r.isRequired).length === 0) {
    throw new Error("At least one required recipient is required");
  }

  // Finalize non-preview document
  const mergeContext = (detail.package.metadata["mergeContext"] as MergeFieldContext) ?? {};
  const finalDoc = generateDocumentFromTemplate({
    title: detail.package.subject ?? "Agreement",
    documentType: detail.package.documentType,
    context: mergeContext,
    preview: false
  });
  if (finalDoc.missingFields.length > 0) {
    throw new Error(`Missing merge fields: ${finalDoc.missingFields.join(", ")}`);
  }

  await supabase
    .from("signature_package_documents")
    .delete()
    .eq("organization_id", organizationId)
    .eq("signature_request_id", packageId);

  const { data: docRow, error: docError } = await supabase
    .from("signature_package_documents")
    .insert({
      organization_id: organizationId,
      signature_request_id: packageId,
      document_type: detail.package.documentType,
      title: finalDoc.title,
      version: finalDoc.version,
      content_hash: finalDoc.contentHash,
      content_text: finalDoc.contentText,
      content_base64: finalDoc.contentBase64,
      is_preview: false,
      sort_order: 0
    })
    .select("*")
    .single();
  if (docError || !docRow) throw new Error(docError?.message ?? "Document finalize failed");

  const provider = getSignatureProvider(detail.package.provider);
  let envelope: EnvelopeRef;
  try {
    envelope = await provider.createEnvelope({
      organizationId,
      packageId,
      packageNumber: detail.package.packageNumber,
      subject: detail.package.subject ?? detail.package.packageNumber,
      message: detail.package.message,
      expiresAt: detail.package.expiresAt,
      documents: [
        {
          title: finalDoc.title,
          fileName: `${detail.package.packageNumber}.pdf`,
          contentBase64: finalDoc.contentBase64,
          contentType: "application/pdf"
        }
      ],
      recipients: detail.recipients
        .filter((r: SignatureRecipientRecord) => r.role !== "cc_viewer")
        .map((r: SignatureRecipientRecord) => ({
          id: r.id,
          role: r.role,
          fullName: r.fullName,
          email: r.email || `signer-${r.id.slice(0, 8)}@example.invalid`,
          signingOrder: r.signingOrder,
          signingGroup: r.signingGroup,
          isRequired: r.isRequired
        })),
      sandbox: true
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provider send failed";
    await supabase
      .from("signature_requests")
      .update({
        status: "failed",
        last_error: message,
        retry_count: detail.package.retryCount + 1,
        updated_by: userId
      })
      .eq("id", packageId);
    await writeAudit(organizationId, packageId, "signature.package.failed", message, userId, {}, supabase);
    throw error;
  }

  const now = new Date().toISOString();
  for (const recipient of detail.recipients) {
    const externalId = envelope.recipientExternalIds?.[recipient.id] ?? null;
    const signingUrl = envelope.signingUrls?.[recipient.id] ?? null;
    await supabase
      .from("signature_recipients")
      .update({
        status: "invited",
        invited_at: now,
        external_recipient_id: externalId,
        signing_url: signingUrl
      })
      .eq("id", recipient.id)
      .eq("organization_id", organizationId);
  }

  await supabase
    .from("signature_requests")
    .update({
      status: "sent",
      external_reference: envelope.externalReference,
      sent_at: now,
      last_error: null,
      updated_by: userId
    })
    .eq("id", packageId)
    .eq("organization_id", organizationId);

  await writeAudit(
    organizationId,
    packageId,
    "signature.package.sent",
    `Package sent via ${provider.id}`,
    userId,
    { externalReference: envelope.externalReference },
    supabase
  );

  // Notifications (best-effort)
  try {
    await notify({
      organizationId,
      category: "leases",
      priority: "high",
      title: "Signature invitations sent",
      body: `${detail.package.packageNumber} was sent for electronic signature.`,
      eventKey: `signature.sent.${packageId}`,
      recipientUserIds: [userId],
      href: detail.package.applicantId
        ? `/applicants/${detail.package.applicantId}`
        : detail.package.leaseId
          ? `/leases/${detail.package.leaseId}`
          : "/leases",
      sourceEntityType: "signature_request",
      sourceEntityId: packageId,
      actorUserId: userId
    });
  } catch {
    // non-blocking
  }

  // Noop/Dropbox sandbox: auto-simulate completion path optional — leave for webhook/simulate
  return getSignaturePackageDetail(organizationId, packageId, supabase);
}

export async function remindSignatureRecipient(
  organizationId: string,
  packageId: string,
  recipientId: string,
  userId: string,
  client?: SignatureClient
) {
  const supabase = await resolveClient(client);
  const detail = await getSignaturePackageDetail(organizationId, packageId, supabase);
  if (!detail) throw new Error("Package not found");
  const recipient = detail.recipients.find((r: SignatureRecipientRecord) => r.id === recipientId);
  if (!recipient) throw new Error("Recipient not found");
  if (["signed", "declined", "skipped"].includes(recipient.status)) {
    throw new Error("Cannot remind a completed recipient");
  }

  const settings = await getSettings(organizationId, supabase);
  if (recipient.reminderCount >= Number(settings.max_reminders ?? 3)) {
    throw new Error("Max reminders reached for recipient");
  }

  const provider = getSignatureProvider(detail.package.provider);
  if (detail.package.externalReference && recipient.externalRecipientId && provider.remindRecipient) {
    await provider.remindRecipient(
      { externalReference: detail.package.externalReference },
      recipient.externalRecipientId
    );
  }

  await supabase
    .from("signature_recipients")
    .update({
      last_reminder_at: new Date().toISOString(),
      reminder_count: recipient.reminderCount + 1
    })
    .eq("id", recipientId);

  await writeAudit(
    organizationId,
    packageId,
    "signature.recipient.reminded",
    `Reminder sent to ${recipient.fullName}`,
    userId,
    { recipientId },
    supabase,
    { recipientId }
  );

  return getSignaturePackageDetail(organizationId, packageId, supabase);
}

export async function cancelSignaturePackage(
  organizationId: string,
  packageId: string,
  userId: string,
  client?: SignatureClient
) {
  const supabase = await resolveClient(client);
  const detail = await getSignaturePackageDetail(organizationId, packageId, supabase);
  if (!detail) throw new Error("Package not found");
  if (["completed", "awaiting_vault_sync", "voided"].includes(detail.package.status)) {
    throw new Error("Cannot cancel a completed package");
  }

  if (detail.package.externalReference) {
    const provider = getSignatureProvider(detail.package.provider);
    try {
      await provider.cancelEnvelope({ externalReference: detail.package.externalReference });
    } catch {
      // continue cancel locally
    }
  }

  await supabase
    .from("signature_requests")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_by: userId
    })
    .eq("id", packageId)
    .eq("organization_id", organizationId);

  await writeAudit(organizationId, packageId, "signature.package.cancelled", "Package cancelled", userId, {}, supabase);
  return getSignaturePackageDetail(organizationId, packageId, supabase);
}

async function syncVaultAndActivate(
  organizationId: string,
  packageId: string,
  actorUserId: string | null,
  client: SignatureClient
) {
  const detail = await getSignaturePackageDetail(organizationId, packageId, client);
  if (!detail) return;
  if (!detail.package.externalReference) throw new Error("Missing provider reference");

  const provider = getSignatureProvider(detail.package.provider);
  const ref = { externalReference: detail.package.externalReference };

  try {
    const executed = await provider.downloadExecutedDocuments(ref);
    const certificate = await provider.downloadCertificate(ref);

    // Resolve a user id for vault create — prefer package creator
    const { data: pkgRow } = await client
      .from("signature_requests")
      .select("created_by")
      .eq("id", packageId)
      .maybeSingle();
    const vaultUserId = (pkgRow?.created_by as string) || actorUserId;
    if (!vaultUserId) throw new Error("No actor for vault write");

    const entityType = detail.package.leaseId ? "lease" : detail.package.applicantId ? "applicant" : "lease";
    const entityId = detail.package.leaseId ?? detail.package.applicantId;
    if (!entityId) throw new Error("Package missing lease/applicant link for vault");

    let certificateDocId: string | null = null;
    for (const artifact of executed) {
      const vaultDoc = await createVaultDocument(
        organizationId,
        vaultUserId,
        {
          entityType,
          entityId,
          documentType: "executed_agreement",
          title: `${detail.package.packageNumber} — Executed`,
          fileUrl: artifact.url ?? `data:${artifact.contentType};base64,${artifact.contentBase64 ?? ""}`,
          notes: "Executed via SignatureService",
          metadata: {
            signaturePackageId: packageId,
            provider: detail.package.provider,
            externalReference: detail.package.externalReference,
            kind: artifact.kind,
            contentHash: createHash("sha256")
              .update(artifact.contentBase64 ?? "")
              .digest("hex")
          }
        },
        client
      );
      await client
        .from("signature_package_documents")
        .update({ vault_document_id: vaultDoc.id })
        .eq("signature_request_id", packageId)
        .eq("organization_id", organizationId);
    }

    if (certificate) {
      const certDoc = await createVaultDocument(
        organizationId,
        vaultUserId,
        {
          entityType,
          entityId,
          documentType: "signature_certificate",
          title: `${detail.package.packageNumber} — Certificate of Completion`,
          fileUrl: certificate.url ?? `data:${certificate.contentType};base64,${certificate.contentBase64 ?? ""}`,
          notes: "Certificate of completion",
          metadata: {
            signaturePackageId: packageId,
            provider: detail.package.provider,
            kind: "certificate"
          }
        },
        client
      );
      certificateDocId = certDoc.id;
    }

    const now = new Date().toISOString();
    await client
      .from("signature_requests")
      .update({
        status: "completed",
        vault_status: "synced",
        vault_last_error: null,
        certificate_vault_document_id: certificateDocId,
        completed_at: detail.package.completedAt ?? now,
        signed_at: detail.package.signedAt ?? now,
        updated_at: now
      })
      .eq("id", packageId)
      .eq("organization_id", organizationId);

    await writeAudit(
      organizationId,
      packageId,
      "signature.vault.stored",
      "Executed documents and certificate stored in vault",
      vaultUserId,
      { certificateDocId },
      client
    );

    // Lease executed
    if (detail.package.leaseId) {
      await client
        .from("leases")
        .update({ status: "signed", updated_by: vaultUserId })
        .eq("id", detail.package.leaseId)
        .eq("organization_id", organizationId);
      await writeAudit(
        organizationId,
        packageId,
        "lease.executed",
        "Lease marked signed/executed after signatures + vault sync",
        vaultUserId,
        { leaseId: detail.package.leaseId },
        client
      );
    }

    // Resident activation ONLY after vault sync (Q4)
    const settings = await getSettings(organizationId, client);
    if (settings.activate_resident_on_complete !== false) {
      await activateResidentFromPackage(organizationId, packageId, vaultUserId, client);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vault sync failed";
    await client
      .from("signature_requests")
      .update({
        status: "awaiting_vault_sync",
        vault_status: "awaiting_vault_sync",
        vault_retry_count: detail.package.vaultRetryCount + 1,
        vault_last_error: message
      })
      .eq("id", packageId)
      .eq("organization_id", organizationId);
    await writeAudit(
      organizationId,
      packageId,
      "signature.vault.awaiting_sync",
      message,
      actorUserId,
      {},
      client
    );
  }
}

async function activateResidentFromPackage(
  organizationId: string,
  packageId: string,
  userId: string,
  client: SignatureClient
) {
  const detail = await getSignaturePackageDetail(organizationId, packageId, client);
  if (!detail) return;
  if (detail.package.vaultStatus !== "synced") {
    throw new Error("Resident activation blocked until vault sync completes");
  }
  if (detail.package.residentActivatedAt) return;

  // Prefer linking existing tenant on lease; otherwise create from applicant
  let tenantId = detail.package.tenantId;
  if (!tenantId && detail.package.leaseId) {
    const { data: lease } = await client
      .from("leases")
      .select("tenant_id")
      .eq("id", detail.package.leaseId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    tenantId = (lease?.tenant_id as string | null) ?? null;
  }

  if (!tenantId && detail.package.applicantId) {
    const { data: applicant } = await client
      .from("applicants")
      .select("*")
      .eq("id", detail.package.applicantId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (applicant) {
      const { data: tenant, error } = await client
        .from("tenants")
        .insert({
          organization_id: organizationId,
          first_name: applicant.first_name,
          last_name: applicant.last_name,
          email: applicant.email,
          phone: applicant.phone,
          status: "active",
          created_by: userId,
          updated_by: userId
        })
        .select("id")
        .single();
      if (!error && tenant) {
        tenantId = tenant.id as string;
        await client
          .from("applicants")
          .update({ status: "converted_to_resident", updated_by: userId, tenant_id: tenantId })
          .eq("id", detail.package.applicantId)
          .eq("organization_id", organizationId);
      }
    }
  }

  await client
    .from("signature_requests")
    .update({
      resident_activated_at: new Date().toISOString(),
      tenant_id: tenantId,
      updated_by: userId
    })
    .eq("id", packageId)
    .eq("organization_id", organizationId);

  await writeAudit(
    organizationId,
    packageId,
    "resident.activated",
    "Resident activation recorded after required signatures + vault sync",
    userId,
    { tenantId },
    client
  );

  if (detail.package.applicantId) {
    await recordApplicantEvent(
      organizationId,
      detail.package.applicantId,
      userId,
      "signature_completed",
      "Resident activated after electronic signature completion",
      { packageId, tenantId },
      client
    );
  }
}

export async function retryVaultSync(
  organizationId: string,
  packageId: string,
  userId: string,
  client?: SignatureClient
) {
  const supabase = await resolveClient(client);
  await syncVaultAndActivate(organizationId, packageId, userId, supabase);
  return getSignaturePackageDetail(organizationId, packageId, supabase);
}

export async function applyProviderWebhook(
  providerId: string,
  payload: unknown,
  headers: Record<string, string>
) {
  const provider = getSignatureProvider(providerId);
  const events = await provider.parseWebhook(payload, headers);
  const admin = await adminClient();
  const results = [];

  for (const event of events) {
    const digest = event.payloadDigest ?? event.externalEventId;
    const { data: existing } = await admin
      .from("integrations_webhook_events")
      .select("id")
      .eq("provider", provider.id)
      .eq("external_event_id", event.externalEventId)
      .maybeSingle();
    if (existing) {
      results.push({ externalEventId: event.externalEventId, ignored: true, reason: "duplicate" });
      continue;
    }

    await admin.from("integrations_webhook_events").insert({
      provider: provider.id,
      external_event_id: event.externalEventId,
      organization_id: null,
      payload: { ...(payload as object), _digest: digest } as Json,
      headers: {} as Json,
      status: "received"
    });

    if (!event.externalEnvelopeId) {
      results.push({ externalEventId: event.externalEventId, ignored: true, reason: "no envelope" });
      continue;
    }

    const { data: pkgRow } = await admin
      .from("signature_requests")
      .select("*")
      .eq("external_reference", event.externalEnvelopeId)
      .maybeSingle();
    if (!pkgRow) {
      results.push({ externalEventId: event.externalEventId, ignored: true, reason: "package not found" });
      continue;
    }

    const organizationId = pkgRow.organization_id as string;
    const packageId = pkgRow.id as string;

    if (event.recipientExternalId || event.recipientEmail) {
      let recipientQuery = admin
        .from("signature_recipients")
        .select("*")
        .eq("signature_request_id", packageId)
        .eq("organization_id", organizationId);
      if (event.recipientExternalId) {
        recipientQuery = recipientQuery.eq("external_recipient_id", event.recipientExternalId);
      } else if (event.recipientEmail) {
        recipientQuery = recipientQuery.ilike("email", event.recipientEmail);
      }
      const { data: recipient } = await recipientQuery.maybeSingle();
      if (recipient) {
        const patch: Record<string, unknown> = {};
        if (event.type === "viewed") {
          patch["status"] = "viewed";
          patch["viewed_at"] = event.occurredAt;
        }
        if (event.type === "signed") {
          patch["status"] = "signed";
          patch["signed_at"] = event.occurredAt;
        }
        if (event.type === "declined") {
          patch["status"] = "declined";
          patch["declined_at"] = event.occurredAt;
        }
        if (event.ipAddress) patch["ip_address"] = event.ipAddress;
        if (event.userAgent) patch["user_agent"] = event.userAgent;
        if (Object.keys(patch).length) {
          await admin.from("signature_recipients").update(patch).eq("id", recipient.id);
        }
        const auditExtras: { recipientId?: string | null; ipAddress?: string | null; userAgent?: string | null } = {
          recipientId: recipient.id as string
        };
        if (event.ipAddress != null) auditExtras.ipAddress = event.ipAddress;
        if (event.userAgent != null) auditExtras.userAgent = event.userAgent;
        await writeAudit(
          organizationId,
          packageId,
          `signature.recipient.${event.type}`,
          `Recipient ${recipient.full_name} ${event.type}`,
          null,
          { event },
          admin,
          auditExtras
        );
      }
    }

    if (event.type === "declined") {
      await admin
        .from("signature_requests")
        .update({ status: "declined" })
        .eq("id", packageId);
    } else if (event.type === "expired") {
      await admin.from("signature_requests").update({ status: "expired" }).eq("id", packageId);
    } else if (event.type === "cancelled") {
      await admin.from("signature_requests").update({ status: "cancelled" }).eq("id", packageId);
    } else if (event.type === "failed") {
      await admin.from("signature_requests").update({ status: "failed" }).eq("id", packageId);
    } else if (event.type === "completed" || event.type === "signed") {
      // Recompute package status from recipients
      const { data: recipients } = await admin
        .from("signature_recipients")
        .select("*")
        .eq("signature_request_id", packageId)
        .eq("organization_id", organizationId);
      const required = (recipients ?? []).filter(
        (r: Record<string, unknown>) => r["is_required"] && r["role"] !== "cc_viewer"
      );
      const allSigned =
        event.type === "completed" ||
        (required.length > 0 && required.every((r: Record<string, unknown>) => r["status"] === "signed"));
      const someSigned = required.some((r: Record<string, unknown>) => r["status"] === "signed");

      if (allSigned) {
        await admin
          .from("signature_requests")
          .update({
            status: "awaiting_vault_sync",
            vault_status: "awaiting_vault_sync",
            completed_at: event.occurredAt,
            signed_at: event.occurredAt
          })
          .eq("id", packageId);
        await writeAudit(
          organizationId,
          packageId,
          "signature.package.completed",
          "All required signatures complete — syncing vault",
          null,
          { event },
          admin
        );
        await syncVaultAndActivate(organizationId, packageId, null, admin);
      } else if (someSigned) {
        await admin
          .from("signature_requests")
          .update({ status: "partially_signed" })
          .eq("id", packageId);
      } else {
        await admin.from("signature_requests").update({ status: "in_progress" }).eq("id", packageId);
      }
    } else if (event.type === "viewed" || event.type === "sent") {
      await admin.from("signature_requests").update({ status: "in_progress" }).eq("id", packageId);
    }

    results.push({ externalEventId: event.externalEventId, applied: true });
  }

  return { results };
}

export async function getProgressByToken(token: string) {
  const admin = await adminClient();
  const { data: recipient, error } = await admin
    .from("signature_recipients")
    .select("*")
    .eq("progress_token", token)
    .maybeSingle();
  if (error || !recipient) return null;
  const organizationId = recipient.organization_id as string;
  const packageId = recipient.signature_request_id as string;
  const detail = await getSignaturePackageDetail(organizationId, packageId, admin);
  if (!detail) return null;
  return {
    recipient: mapRecipient(recipient as Record<string, unknown>),
    package: detail.package,
    recipients: detail.recipients.map((r: SignatureRecipientRecord) => ({
      ...r,
      progressToken: null,
      progressUrl: null,
      email: r.id === recipient.id ? r.email : null
    })),
    progress: detail.progress,
    documents: detail.documents.map((d: SignaturePackageDocumentRecord) => ({
      id: d.id,
      title: d.title,
      documentType: d.documentType,
      isPreview: d.isPreview,
      contentText: d.isPreview ? d.contentText : null
    }))
  };
}

export async function markRecipientViewedByToken(token: string) {
  const admin = await adminClient();
  const progress = await getProgressByToken(token);
  if (!progress) throw new Error("Invalid progress token");
  if (["signed", "declined"].includes(progress.recipient.status)) return progress;

  await admin
    .from("signature_recipients")
    .update({
      status: progress.recipient.status === "pending" ? "viewed" : progress.recipient.status === "invited" ? "viewed" : progress.recipient.status,
      viewed_at: new Date().toISOString()
    })
    .eq("id", progress.recipient.id);

  await writeAudit(
    progress.package.organizationId,
    progress.package.id,
    "signature.recipient.viewed",
    `${progress.recipient.fullName} viewed signing progress`,
    null,
    {},
    admin,
    { recipientId: progress.recipient.id }
  );

  return getProgressByToken(token);
}

/** Sandbox helper: complete all required signers + vault sync without provider network */
export async function simulateSandboxCompletion(
  organizationId: string,
  packageId: string,
  userId: string,
  client?: SignatureClient
) {
  const supabase = await resolveClient(client);
  const detail = await getSignaturePackageDetail(organizationId, packageId, supabase);
  if (!detail) throw new Error("Package not found");
  if (!detail.package.externalReference) {
    throw new Error("Package has not been sent");
  }

  const now = new Date().toISOString();
  for (const recipient of detail.recipients.filter((r: SignatureRecipientRecord) => r.isRequired)) {
    await supabase
      .from("signature_recipients")
      .update({ status: "signed", signed_at: now, viewed_at: recipient.viewedAt ?? now })
      .eq("id", recipient.id);
  }

  await applyProviderWebhook(
    detail.package.provider === "hellosign" ? "dropbox_sign" : detail.package.provider,
    {
      id: `sim-complete-${Date.now()}`,
      type: "signature_request_all_signed",
      event_type: "signature_request_all_signed",
      externalReference: detail.package.externalReference,
      signature_request: { signature_request_id: detail.package.externalReference, is_complete: true }
    },
    { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
  );

  await writeAudit(
    organizationId,
    packageId,
    "signature.sandbox.simulated",
    "Sandbox completion simulated",
    userId,
    {},
    supabase
  );

  return getSignaturePackageDetail(organizationId, packageId, supabase);
}

export async function getSignatureOpsSnapshot(
  organizationId: string,
  client?: SignatureClient
): Promise<SignatureOpsSnapshot> {
  const supabase = await resolveClient(client);
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [
    { count: pending },
    { count: completedToday },
    { count: expired },
    { count: reminderQueue },
    { count: failures },
    { count: awaitingVault },
    { data: completedRows }
  ] = await Promise.all([
    supabase
      .from("signature_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["sent", "in_progress", "partially_signed", "ready_to_send"]),
    supabase
      .from("signature_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .gte("completed_at", startOfDay.toISOString()),
    supabase
      .from("signature_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "expired"),
    supabase
      .from("signature_recipients")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["invited", "viewed"])
      .gte("reminder_count", 1),
    supabase
      .from("signature_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "failed"),
    supabase
      .from("signature_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("vault_status", ["awaiting_vault_sync", "failed"]),
    supabase
      .from("signature_requests")
      .select("sent_at, completed_at")
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .not("sent_at", "is", null)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(50)
  ]);

  let averageCompletionHours: number | null = null;
  const rows = (completedRows ?? []) as Array<{ sent_at: string; completed_at: string }>;
  if (rows.length > 0) {
    const total = rows.reduce((sum, row) => {
      return sum + (new Date(row.completed_at).getTime() - new Date(row.sent_at).getTime());
    }, 0);
    averageCompletionHours = Math.round((total / rows.length / 36e5) * 10) / 10;
  }

  return {
    pendingSignatures: pending ?? 0,
    completedToday: completedToday ?? 0,
    expiredRequests: expired ?? 0,
    reminderQueue: reminderQueue ?? 0,
    providerFailures: failures ?? 0,
    awaitingVaultSync: awaitingVault ?? 0,
    averageCompletionHours
  };
}

/** Backward-compatible entry used by applicant module — delegates to SignatureService */
export async function createSignatureRequestCompat(
  organizationId: string,
  applicantId: string,
  userId: string,
  input: { provider?: string; requestType?: string } = {},
  client?: SignatureClient
) {
  const compatInput: CreateSignaturePackageInput = {
    applicantId,
    documentType: (input.requestType as SignatureDocumentType | undefined) ?? "lease_agreement"
  };
  if (input.provider) compatInput.provider = input.provider;
  return createSignaturePackage(organizationId, userId, compatInput, client);
}
