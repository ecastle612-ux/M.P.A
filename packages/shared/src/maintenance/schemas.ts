import { z } from "zod";

export const WORK_ORDER_STATUSES = [
  "submitted",
  "triaged",
  "assigned",
  "in_progress",
  "completed",
  "closed",
  "cancelled"
] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  submitted: "Submitted",
  triaged: "Triaged",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
  closed: "Closed",
  cancelled: "Cancelled"
};

export const WORK_ORDER_PRIORITIES = ["low", "normal", "high", "emergency"] as const;
export type WorkOrderPriority = (typeof WORK_ORDER_PRIORITIES)[number];

export const WORK_ORDER_PRIORITY_LABELS: Record<WorkOrderPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  emergency: "Emergency"
};

export const WORK_ORDER_CATEGORIES = [
  "general",
  "plumbing",
  "electrical",
  "hvac",
  "appliance",
  "structural",
  "other"
] as const;
export type WorkOrderCategory = (typeof WORK_ORDER_CATEGORIES)[number];

export const createWorkOrderInputSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(3).max(4000),
  category: z.enum(WORK_ORDER_CATEGORIES).default("general"),
  priority: z.enum(WORK_ORDER_PRIORITIES).default("normal")
});
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderInputSchema>;

export const triageWorkOrderInputSchema = z.object({
  workOrderId: z.string().uuid(),
  priority: z.enum(WORK_ORDER_PRIORITIES)
});
export type TriageWorkOrderInput = z.infer<typeof triageWorkOrderInputSchema>;

export const assignWorkOrderInputSchema = z.object({
  workOrderId: z.string().uuid(),
  assigneeType: z.enum(["technician", "vendor"]),
  technicianUserId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  note: z.string().trim().max(1000).optional()
});
export type AssignWorkOrderInput = z.infer<typeof assignWorkOrderInputSchema>;

export const progressWorkOrderInputSchema = z.object({
  workOrderId: z.string().uuid(),
  action: z.enum(["start", "progress", "complete"]),
  note: z.string().trim().min(1).max(2000)
});
export type ProgressWorkOrderInput = z.infer<typeof progressWorkOrderInputSchema>;

export const confirmWorkOrderInputSchema = z.object({
  workOrderId: z.string().uuid(),
  note: z.string().trim().max(1000).optional()
});
export type ConfirmWorkOrderInput = z.infer<typeof confirmWorkOrderInputSchema>;

export const createVendorDirectoryInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254).optional(),
  phone: z.string().trim().max(40).optional(),
  userId: z.string().uuid().optional()
});
export type CreateVendorDirectoryInput = z.infer<typeof createVendorDirectoryInputSchema>;
