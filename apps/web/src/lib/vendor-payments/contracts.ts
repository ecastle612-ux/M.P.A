export const VENDOR_INVOICE_STATUSES = [
  "awaiting_approval",
  "approved",
  "rejected",
  "revision_requested",
  "paid"
] as const;

export type VendorInvoiceStatus = (typeof VENDOR_INVOICE_STATUSES)[number];

export const VENDOR_PAYMENT_METHODS = ["mark_paid", "check", "other", "ach_future"] as const;
export type VendorPaymentMethod = (typeof VENDOR_PAYMENT_METHODS)[number];

export type VendorInvoiceRecord = {
  id: string;
  organizationId: string;
  workOrderId: string;
  propertyId: string;
  vendorId: string | null;
  invoiceNumber: string | null;
  amount: number;
  currency: string;
  notes: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  pdfPath: string | null;
  photoPaths: string[];
  status: VendorInvoiceStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  expenseId: string | null;
  paymentId: string | null;
  pdfSignedUrl: string | null;
};

export type VendorPaymentRecord = {
  id: string;
  organizationId: string;
  invoiceId: string;
  workOrderId: string;
  propertyId: string;
  vendorId: string | null;
  amount: number;
  currency: string;
  paymentMethod: VendorPaymentMethod;
  referenceNumber: string | null;
  paidAt: string;
  status: "paid" | "void";
  recordedBy: string;
  expenseId: string | null;
  notes: string | null;
  createdAt: string;
};

export type VendorFinancialHistory = {
  invoices: VendorInvoiceRecord[];
  payments: VendorPaymentRecord[];
  outstandingCount: number;
  paidCount: number;
  outstandingTotal: number;
  paidTotal: number;
};
