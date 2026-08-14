import { z } from "zod";
import {
  WORK_ORDER_CATEGORIES,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
  type WorkSurface
} from "../maintenance/schemas";

export const WORK_ORDER_REPORT_CSV_ROW_CAP = 10_000;
export const WORK_ORDER_REPORT_PDF_ROW_CAP = 500;

export const WORK_ORDER_REPORT_DATE_MODES = ["created", "completed"] as const;
export type WorkOrderReportDateMode = (typeof WORK_ORDER_REPORT_DATE_MODES)[number];

export const WORK_ORDER_REPORT_SURFACE_LABELS: Record<WorkSurface, string> = {
  facility: "Facility Operations",
  residential: "Property Operations"
};

export const workOrderReportFiltersSchema = z.object({
  dateFrom: z.string().min(1),
  dateTo: z.string().min(1),
  dateMode: z.enum(WORK_ORDER_REPORT_DATE_MODES).default("created"),
  propertyIds: z.array(z.string().uuid()).default([]),
  location: z.string().trim().max(200).optional(),
  statuses: z.array(z.enum(WORK_ORDER_STATUSES)).default([]),
  priorities: z.array(z.enum(WORK_ORDER_PRIORITIES)).default([]),
  categories: z.array(z.enum(WORK_ORDER_CATEGORIES)).default([]),
  vendorIds: z.array(z.string().uuid()).default([]),
  userIds: z.array(z.string().uuid()).default([]),
  includeUnassignedVendor: z.boolean().default(false)
});

export type WorkOrderReportFilters = z.infer<typeof workOrderReportFiltersSchema>;

export type WorkOrderReportBreakdownItem = {
  key: string;
  label: string;
  count: number;
};

export type WorkOrderReportMetrics = {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  averageCompletionHours: number | null;
  completionRate: number | null;
  byCategory: WorkOrderReportBreakdownItem[];
  byPriority: WorkOrderReportBreakdownItem[];
  byVendor: WorkOrderReportBreakdownItem[];
};

export type WorkOrderReportExportRow = {
  workOrderId: string;
  createdDate: string;
  requestedBy: string;
  location: string;
  category: string;
  priority: string;
  description: string;
  assignedVendor: string;
  assignedUser: string;
  status: string;
  completedDate: string;
  completionNotes: string;
  mediaAttached: "Yes" | "No";
};

export type WorkOrderReportSnapshot = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  surface: (typeof WORK_SURFACES)[number];
  surfaceLabel: string;
  generatedAt: string;
  generatedByUserId: string;
  generatedByDisplayName: string;
  filters: WorkOrderReportFilters;
  metrics: WorkOrderReportMetrics;
  rows: WorkOrderReportExportRow[];
  truncated: boolean;
  totalMatched: number;
};

export const WORK_ORDER_REPORT_CSV_HEADERS = [
  "Work order ID",
  "Created date",
  "Requested by",
  "Location",
  "Category",
  "Priority",
  "Description",
  "Assigned vendor",
  "Assigned user",
  "Status",
  "Completed date",
  "Completion notes",
  "Media attached"
] as const;

export const OPEN_WORK_ORDER_STATUSES = ["submitted", "triaged", "assigned"] as const;
export const COMPLETED_WORK_ORDER_STATUSES = ["completed", "closed"] as const;
