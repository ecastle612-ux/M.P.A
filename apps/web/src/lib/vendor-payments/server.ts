import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@mpa/supabase";
import { createAuthServerComponentClient, createServiceRoleServerClient } from "../auth/server";
import { createExpense, recordFinancialActivity } from "../financial/server";
import { sendWorkflowEmail } from "../integrations/email/delivery";
import { notify } from "../notifications/service";
import type {
  VendorFinancialHistory,
  VendorInvoiceRecord,
  VendorInvoiceStatus,
  VendorPaymentMethod,
  VendorPaymentRecord
} from "./contracts";

// Tables may lag generated Database types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function resolveClient(client?: SupabaseClient<Database>): Promise<AnyClient> {
  return client ?? (await createAuthServerComponentClient());
}

async function adminClient(): Promise<AnyClient> {
  return createServiceRoleServerClient() as AnyClient;
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function mapInvoice(row: Record<string, unknown>, pdfSignedUrl: string | null = null): VendorInvoiceRecord {
  const photos = Array.isArray(row["photo_paths"]) ? (row["photo_paths"] as string[]) : [];
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    workOrderId: String(row["work_order_id"]),
    propertyId: String(row["property_id"]),
    vendorId: (row["vendor_id"] as string | null) ?? null,
    invoiceNumber: (row["invoice_number"] as string | null) ?? null,
    amount: Number(row["amount"]),
    currency: String(row["currency"] ?? "usd"),
    notes: (row["notes"] as string | null) ?? null,
    contactEmail: (row["contact_email"] as string | null) ?? null,
    contactPhone: (row["contact_phone"] as string | null) ?? null,
    pdfPath: (row["pdf_path"] as string | null) ?? null,
    photoPaths: photos,
    status: row["status"] as VendorInvoiceStatus,
    submittedAt: String(row["submitted_at"]),
    reviewedAt: (row["reviewed_at"] as string | null) ?? null,
    reviewedBy: (row["reviewed_by"] as string | null) ?? null,
    reviewNotes: (row["review_notes"] as string | null) ?? null,
    expenseId: (row["expense_id"] as string | null) ?? null,
    paymentId: null,
    pdfSignedUrl
  };
}

function mapPayment(row: Record<string, unknown>): VendorPaymentRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    invoiceId: String(row["invoice_id"]),
    workOrderId: String(row["work_order_id"]),
    propertyId: String(row["property_id"]),
    vendorId: (row["vendor_id"] as string | null) ?? null,
    amount: Number(row["amount"]),
    currency: String(row["currency"] ?? "usd"),
    paymentMethod: row["payment_method"] as VendorPaymentMethod,
    referenceNumber: (row["reference_number"] as string | null) ?? null,
    paidAt: String(row["paid_at"]),
    status: row["status"] as "paid" | "void",
    recordedBy: String(row["recorded_by"]),
    expenseId: (row["expense_id"] as string | null) ?? null,
    notes: (row["notes"] as string | null) ?? null,
    createdAt: String(row["created_at"])
  };
}

async function signedMediaUrl(admin: AnyClient, path: string | null): Promise<string | null> {
  if (!path || path.startsWith("pending:")) return null;
  const { data } = await admin.storage.from("media").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

async function recordActivity(
  admin: AnyClient,
  input: {
    organizationId: string;
    workOrderId: string;
    eventType: string;
    summary: string;
    details?: Record<string, unknown>;
    actorUserId?: string | null;
  }
) {
  await admin.from("maintenance_activity_events").insert({
    organization_id: input.organizationId,
    work_order_id: input.workOrderId,
    event_type: input.eventType,
    summary: input.summary,
    details: (input.details ?? {}) as Json,
    actor_user_id: input.actorUserId ?? null
  });
}

async function notifyManagers(
  admin: AnyClient,
  organizationId: string,
  workOrder: {
    id: string;
    title: string;
    work_order_number: string;
    created_by: string;
    assigned_to_user_id: string | null;
    property_id: string;
    unit_id: string | null;
  },
  title: string,
  body: string,
  eventKey: string
) {
  const { data: memberships } = await admin
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  const managerIds = ((memberships ?? []) as Array<{ user_id: string; roles: string[] | null }>)
    .filter(
      (row) =>
        Array.isArray(row.roles) &&
        (row.roles.includes("property_manager") || row.roles.includes("owner"))
    )
    .map((row) => row.user_id);

  const recipientUserIds = [
    ...new Set(
      [...managerIds, workOrder.created_by, workOrder.assigned_to_user_id].filter(
        (id): id is string => Boolean(id)
      )
    )
  ];
  if (recipientUserIds.length === 0) return;

  await notify(
    {
      organizationId,
      actorUserId: null,
      eventKey,
      recipientUserIds,
      category: "maintenance",
      priority: "normal",
      title,
      body,
      href: `/maintenance/${workOrder.id}`,
      sourceEntityType: "maintenance_work_order",
      sourceEntityId: workOrder.id,
      propertyId: workOrder.property_id,
      unitId: workOrder.unit_id
    },
    admin
  ).catch(() => undefined);
}

async function notifyVendorEmail(input: {
  organizationId: string;
  email: string | null | undefined;
  subject: string;
  body: string;
  idempotencyKey: string;
  workOrderId: string;
}) {
  const email = input.email?.trim();
  if (!email || !email.includes("@")) return;
  await sendWorkflowEmail({
    organizationId: input.organizationId,
    templateKey: "general_notification",
    idempotencyKey: input.idempotencyKey,
    to: { email },
    subject: input.subject,
    body: input.body,
    href: null,
    title: input.subject,
    correlation: {
      sourceEntityType: "maintenance_work_order",
      sourceEntityId: input.workOrderId
    }
  }).catch(() => undefined);
}

async function loadTokenContext(rawToken: string) {
  const admin = await adminClient();
  const tokenHash = hashToken(rawToken);
  const { data: token } = await admin
    .from("vendor_work_order_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!token || token.revoked_at) {
    throw Object.assign(new Error("Link unavailable"), { status: 410 });
  }
  if (token.expires_at && new Date(token.expires_at).getTime() < Date.now()) {
    throw Object.assign(new Error("Link expired"), { status: 410 });
  }

  const { data: wo } = await admin
    .from("maintenance_work_orders")
    .select("*")
    .eq("id", token.work_order_id)
    .eq("organization_id", token.organization_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!wo) throw Object.assign(new Error("Work order not found"), { status: 404 });

  return { admin, token: token as Record<string, unknown>, wo: wo as Record<string, unknown> };
}

export async function getInvoiceForWorkOrder(
  organizationId: string,
  workOrderId: string,
  client?: SupabaseClient<Database>
): Promise<VendorInvoiceRecord | null> {
  const db = await resolveClient(client);
  const admin = await adminClient();
  const { data } = await db
    .from("vendor_invoices")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const invoice = mapInvoice(data as Record<string, unknown>, await signedMediaUrl(admin, data.pdf_path));
  const { data: payment } = await db
    .from("vendor_payments")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("invoice_id", invoice.id)
    .eq("status", "paid")
    .maybeSingle();
  invoice.paymentId = (payment?.id as string | null) ?? null;
  return invoice;
}

export async function getInvoiceByToken(rawToken: string): Promise<VendorInvoiceRecord | null> {
  const { admin, wo } = await loadTokenContext(rawToken);
  const { data } = await admin
    .from("vendor_invoices")
    .select("*")
    .eq("organization_id", wo["organization_id"])
    .eq("work_order_id", wo["id"])
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return mapInvoice(data as Record<string, unknown>, await signedMediaUrl(admin, data.pdf_path));
}

export async function uploadVendorInvoiceFile(
  rawToken: string,
  file: { bytes: Uint8Array; contentType: string; fileName: string },
  kind: "pdf" | "photo"
): Promise<string> {
  const { admin, token, wo } = await loadTokenContext(rawToken);
  if (!["awaiting_approval", "completed", "vendor_on_site"].includes(String(wo["status"]))) {
    // Allow after finish (awaiting_approval) or revision — also when completed later
  }
  const status = String(wo["status"]);
  if (status === "cancelled") {
    throw Object.assign(new Error("Job unavailable"), { status: 409 });
  }

  const ext =
    kind === "pdf"
      ? "pdf"
      : file.fileName.includes(".")
        ? file.fileName.split(".").pop()?.slice(0, 8) || "jpg"
        : "jpg";
  const path = `${token["organization_id"]}/${token["work_order_id"]}/invoice-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const { error } = await admin.storage.from("media").upload(path, file.bytes, {
    contentType: file.contentType || (kind === "pdf" ? "application/pdf" : "image/jpeg"),
    upsert: false
  });
  if (error) return `pending:${path}`;
  return path;
}

export async function submitVendorInvoiceByToken(
  rawToken: string,
  input: {
    amount: number;
    invoiceNumber?: string | null;
    notes?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    pdfPath?: string | null;
    photoPaths?: string[];
  }
): Promise<VendorInvoiceRecord> {
  const { admin, token, wo } = await loadTokenContext(rawToken);
  const status = String(wo["status"]);
  if (!["awaiting_approval", "completed"].includes(status)) {
    throw Object.assign(new Error("Finish the job before uploading an invoice"), { status: 409 });
  }
  if (!(input.amount > 0) || !Number.isFinite(input.amount)) {
    throw Object.assign(new Error("Invoice amount is required"), { status: 400 });
  }

  const { data: existing } = await admin
    .from("vendor_invoices")
    .select("*")
    .eq("organization_id", wo["organization_id"])
    .eq("work_order_id", wo["id"])
    .in("status", ["awaiting_approval", "approved", "paid", "revision_requested"])
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && ["approved", "paid"].includes(String(existing.status))) {
    throw Object.assign(new Error("Invoice already approved or paid"), { status: 409 });
  }

  const now = new Date().toISOString();
  const payload = {
    organization_id: wo["organization_id"],
    work_order_id: wo["id"],
    property_id: wo["property_id"],
    vendor_id: wo["vendor_id"] ?? token["vendor_id"] ?? null,
    invoice_number: input.invoiceNumber?.trim() || null,
    amount: Math.round(input.amount * 100) / 100,
    currency: "usd",
    notes: input.notes?.trim()?.slice(0, 4000) || null,
    contact_email: input.contactEmail?.trim()?.slice(0, 320) || null,
    contact_phone: input.contactPhone?.trim()?.slice(0, 64) || null,
    pdf_path: input.pdfPath || null,
    photo_paths: (input.photoPaths ?? []).slice(0, 12),
    status: "awaiting_approval",
    submitted_at: now,
    reviewed_at: null,
    reviewed_by: null,
    review_notes: null
  };

  let row: Record<string, unknown>;
  if (existing && String(existing.status) === "revision_requested") {
    const { data, error } = await admin
      .from("vendor_invoices")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to update invoice");
    row = data as Record<string, unknown>;
  } else if (existing && String(existing.status) === "awaiting_approval") {
    const { data, error } = await admin
      .from("vendor_invoices")
      .update(payload)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to update invoice");
    row = data as Record<string, unknown>;
  } else {
    const { data, error } = await admin.from("vendor_invoices").insert(payload).select("*").single();
    if (error || !data) throw new Error(error?.message ?? "Failed to submit invoice");
    row = data as Record<string, unknown>;
  }

  await recordActivity(admin, {
    organizationId: String(wo["organization_id"]),
    workOrderId: String(wo["id"]),
    eventType: "vendor_invoice_submitted",
    summary: `Vendor invoice submitted · $${Number(payload.amount).toFixed(2)}`,
    details: { invoiceId: row["id"], amount: payload.amount }
  });

  await notifyManagers(
    admin,
    String(wo["organization_id"]),
    wo as never,
    "Vendor invoice submitted",
    `${wo["work_order_number"]}: $${Number(payload.amount).toFixed(2)} awaiting review`,
    `maintenance.vendor_invoice_submitted:${wo["id"]}:${now}`
  );

  return mapInvoice(row, await signedMediaUrl(admin, row["pdf_path"] as string | null));
}

async function loadInvoiceForOrg(
  organizationId: string,
  invoiceId: string,
  client?: SupabaseClient<Database>
) {
  const db = await resolveClient(client);
  const { data, error } = await db
    .from("vendor_invoices")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", invoiceId)
    .maybeSingle();
  if (error || !data) throw new Error("Invoice not found");
  return data as Record<string, unknown>;
}

export async function reviewVendorInvoice(
  organizationId: string,
  invoiceId: string,
  actorUserId: string,
  action: "approve" | "reject" | "request_revision",
  reviewNotes?: string | null,
  client?: SupabaseClient<Database>
): Promise<VendorInvoiceRecord> {
  const admin = await adminClient();
  const invoice = await loadInvoiceForOrg(organizationId, invoiceId, client);
  if (String(invoice["status"]) !== "awaiting_approval" && String(invoice["status"]) !== "revision_requested") {
    if (action === "approve" && String(invoice["status"]) === "approved") {
      return mapInvoice(invoice, await signedMediaUrl(admin, invoice["pdf_path"] as string | null));
    }
    throw new Error("Invoice is not awaiting review");
  }

  const nextStatus: VendorInvoiceStatus =
    action === "approve" ? "approved" : action === "reject" ? "rejected" : "revision_requested";
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("vendor_invoices")
    .update({
      status: nextStatus,
      reviewed_at: now,
      reviewed_by: actorUserId,
      review_notes: reviewNotes?.trim()?.slice(0, 2000) || null
    })
    .eq("id", invoiceId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Review failed");

  const eventType =
    action === "approve"
      ? "vendor_invoice_approved"
      : action === "reject"
        ? "vendor_invoice_rejected"
        : "vendor_invoice_revision_requested";

  await recordActivity(admin, {
    organizationId,
    workOrderId: String(invoice["work_order_id"]),
    eventType,
    summary:
      action === "approve"
        ? "Vendor invoice approved"
        : action === "reject"
          ? "Vendor invoice rejected"
          : "Vendor invoice revision requested",
    details: { invoiceId, reviewNotes: reviewNotes ?? null },
    actorUserId
  });

  if (action === "approve") {
    await notifyVendorEmail({
      organizationId,
      email: (invoice["contact_email"] as string | null) ?? null,
      subject: "Invoice approved",
      body: `Your invoice for $${Number(invoice["amount"]).toFixed(2)} was approved. Payment will be recorded by the property manager.`,
      idempotencyKey: `vendor-invoice-approved:${invoiceId}`,
      workOrderId: String(invoice["work_order_id"])
    });
  } else if (action === "reject") {
    await notifyVendorEmail({
      organizationId,
      email: (invoice["contact_email"] as string | null) ?? null,
      subject: "Invoice rejected",
      body: `Your invoice was rejected.${reviewNotes ? ` Note: ${reviewNotes}` : ""}`,
      idempotencyKey: `vendor-invoice-rejected:${invoiceId}`,
      workOrderId: String(invoice["work_order_id"])
    });
  } else {
    await notifyVendorEmail({
      organizationId,
      email: (invoice["contact_email"] as string | null) ?? null,
      subject: "Invoice revision requested",
      body: `Please revise and resubmit your invoice.${reviewNotes ? ` Note: ${reviewNotes}` : ""}`,
      idempotencyKey: `vendor-invoice-revision:${invoiceId}:${now}`,
      workOrderId: String(invoice["work_order_id"])
    });
  }

  return mapInvoice(data as Record<string, unknown>, await signedMediaUrl(admin, data.pdf_path));
}

export async function markVendorInvoicePaid(
  organizationId: string,
  invoiceId: string,
  actorUserId: string,
  input: {
    amount?: number;
    paidAt?: string;
    paymentMethod: VendorPaymentMethod;
    referenceNumber?: string | null;
    notes?: string | null;
  },
  client?: SupabaseClient<Database>
): Promise<{ invoice: VendorInvoiceRecord; payment: VendorPaymentRecord }> {
  const admin = await adminClient();
  const invoice = await loadInvoiceForOrg(organizationId, invoiceId, client);
  const status = String(invoice["status"]);
  if (status === "paid") {
    const { data: existingPayment } = await admin
      .from("vendor_payments")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("invoice_id", invoiceId)
      .eq("status", "paid")
      .maybeSingle();
    if (existingPayment) {
      return {
        invoice: mapInvoice(invoice, await signedMediaUrl(admin, invoice["pdf_path"] as string | null)),
        payment: mapPayment(existingPayment as Record<string, unknown>)
      };
    }
  }
  if (status !== "approved") {
    throw new Error("Approve the invoice before Mark Paid");
  }

  const amount = input.amount != null ? Number(input.amount) : Number(invoice["amount"]);
  if (!(amount > 0)) throw new Error("Payment amount must be positive");
  const paidAt = (input.paidAt || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const method = input.paymentMethod === "ach_future" ? "ach_future" : input.paymentMethod;

  const expense = await createExpense(
    organizationId,
    actorUserId,
    {
      propertyId: String(invoice["property_id"]),
      vendorId: (invoice["vendor_id"] as string | null) ?? null,
      workOrderId: String(invoice["work_order_id"]),
      category: "vendor_bill",
      description: `Vendor invoice${invoice["invoice_number"] ? ` ${invoice["invoice_number"]}` : ""} · WO payment`,
      amount,
      expenseDate: paidAt,
      status: "paid",
      vendorBillPlaceholder: invoice["invoice_number"]
        ? String(invoice["invoice_number"])
        : String(invoice["id"]).slice(0, 8)
    },
    admin
  );

  const { data: payment, error: payError } = await admin
    .from("vendor_payments")
    .insert({
      organization_id: organizationId,
      invoice_id: invoiceId,
      work_order_id: invoice["work_order_id"],
      property_id: invoice["property_id"],
      vendor_id: invoice["vendor_id"] ?? null,
      amount,
      currency: invoice["currency"] ?? "usd",
      payment_method: method,
      reference_number: input.referenceNumber?.trim() || null,
      paid_at: paidAt,
      status: "paid",
      recorded_by: actorUserId,
      expense_id: expense.id,
      notes: input.notes?.trim()?.slice(0, 2000) || null,
      metadata: {
        audit: {
          invoiceId,
          workOrderId: invoice["work_order_id"],
          recordedAt: new Date().toISOString()
        }
      } as Json
    })
    .select("*")
    .single();
  if (payError || !payment) throw new Error(payError?.message ?? "Failed to record payment");

  const { data: updatedInvoice, error: invError } = await admin
    .from("vendor_invoices")
    .update({ status: "paid", expense_id: expense.id })
    .eq("id", invoiceId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();
  if (invError || !updatedInvoice) throw new Error(invError?.message ?? "Failed to update invoice");

  await recordActivity(admin, {
    organizationId,
    workOrderId: String(invoice["work_order_id"]),
    eventType: "vendor_payment_recorded",
    summary: `Vendor payment recorded · $${amount.toFixed(2)} · ${method}`,
    details: {
      invoiceId,
      paymentId: payment.id,
      expenseId: expense.id,
      amount,
      method,
      paidAt,
      referenceNumber: input.referenceNumber ?? null
    },
    actorUserId
  });

  await recordFinancialActivity(
    organizationId,
    actorUserId,
    "expense_recorded",
    "vendor_payment",
    String(payment.id),
    {
      propertyId: String(invoice["property_id"]),
      amount,
      summary: `Vendor paid · $${amount.toFixed(2)}`,
      payload: {
        invoiceId,
        paymentMethod: method,
        paidAt,
        workOrderId: invoice["work_order_id"],
        vendorId: invoice["vendor_id"]
      }
    },
    admin
  );

  // Owner statement feed: expense row is the automatic inclusion path (no manual entry).
  const { data: memberships } = await admin
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  const ownerIds = ((memberships ?? []) as Array<{ user_id: string; roles: string[] | null }>)
    .filter((row) => Array.isArray(row.roles) && row.roles.includes("owner"))
    .map((row) => row.user_id);
  if (ownerIds.length > 0) {
    await notify(
      {
        organizationId,
        actorUserId,
        eventKey: `owner.vendor_expense:${payment.id}`,
        recipientUserIds: ownerIds,
        category: "financial",
        priority: "normal",
        title: "Vendor expense recorded",
        body: `$${amount.toFixed(2)} will appear on the next owner statement.`,
        href: `/financials/expenses`,
        sourceEntityType: "expense",
        sourceEntityId: expense.id,
        propertyId: String(invoice["property_id"])
      },
      admin
    ).catch(() => undefined);
  }

  await notifyVendorEmail({
    organizationId,
    email: (invoice["contact_email"] as string | null) ?? null,
    subject: "Vendor payment recorded",
    body: `Payment of $${amount.toFixed(2)} was recorded (${method.replace("_", " ")}).`,
    idempotencyKey: `vendor-paid:${payment.id}`,
    workOrderId: String(invoice["work_order_id"])
  });

  return {
    invoice: mapInvoice(
      updatedInvoice as Record<string, unknown>,
      await signedMediaUrl(admin, updatedInvoice.pdf_path)
    ),
    payment: mapPayment(payment as Record<string, unknown>)
  };
}

export async function getVendorFinancialHistory(
  organizationId: string,
  vendorId: string,
  client?: SupabaseClient<Database>
): Promise<VendorFinancialHistory> {
  const db = await resolveClient(client);
  const [{ data: invoices }, { data: payments }] = await Promise.all([
    db
      .from("vendor_invoices")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("vendor_id", vendorId)
      .order("submitted_at", { ascending: false })
      .limit(100),
    db
      .from("vendor_payments")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("vendor_id", vendorId)
      .order("paid_at", { ascending: false })
      .limit(100)
  ]);

  const invoiceRecords = ((invoices ?? []) as Record<string, unknown>[]).map((row) => mapInvoice(row));
  const paymentRecords = ((payments ?? []) as Record<string, unknown>[]).map((row) => mapPayment(row));
  const outstanding = invoiceRecords.filter((i) =>
    ["awaiting_approval", "approved", "revision_requested"].includes(i.status)
  );
  const paid = invoiceRecords.filter((i) => i.status === "paid");

  return {
    invoices: invoiceRecords,
    payments: paymentRecords,
    outstandingCount: outstanding.length,
    paidCount: paid.length,
    outstandingTotal: outstanding.reduce((sum, i) => sum + i.amount, 0),
    paidTotal: paymentRecords.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0)
  };
}

export async function getPropertyVendorPaymentHistory(
  organizationId: string,
  propertyId: string,
  client?: SupabaseClient<Database>
): Promise<VendorPaymentRecord[]> {
  const db = await resolveClient(client);
  const { data } = await db
    .from("vendor_payments")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(100);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => mapPayment(row));
}
