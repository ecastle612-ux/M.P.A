/**
 * OPS-001 Slice C — maintenance.standard.v1 pilot template (in-code SoT + DB seed).
 */

export const MAINTENANCE_STANDARD_TEMPLATE_ID = "maintenance.standard.v1";

export type WorkflowTransition = {
  from: string;
  on: string;
  to: string;
  task?: string;
  reenter?: boolean;
  terminal?: boolean;
};

export type WorkflowTemplateDefinition = {
  steps: Array<{ id: string; title: string }>;
  transitions: WorkflowTransition[];
  startStep: string;
  startTask?: string;
};

export const MAINTENANCE_STANDARD_DEFINITION: WorkflowTemplateDefinition = {
  steps: [
    { id: "assign_vendor", title: "Assign vendor" },
    { id: "vendor_accepted", title: "Vendor accepted" },
    { id: "on_site", title: "Technician on site" },
    { id: "repair_complete", title: "Repair complete" }
  ],
  transitions: [
    {
      from: "assign_vendor",
      on: "maintenance.vendor.assigned",
      to: "vendor_accepted",
      task: "Confirm vendor acceptance"
    },
    {
      from: "assign_vendor",
      on: "maintenance.vendor.declined",
      to: "assign_vendor",
      task: "Reassign vendor after decline",
      reenter: true
    },
    {
      from: "vendor_accepted",
      on: "maintenance.technician.arrived",
      to: "on_site",
      task: "Complete on-site work"
    },
    {
      from: "on_site",
      on: "maintenance.work.completed",
      to: "repair_complete",
      terminal: true
    }
  ],
  startStep: "assign_vendor",
  startTask: "Assign vendor to work order"
};

export const WORKFLOW_TRIGGER_EVENT_TYPES = ["maintenance.request.created"] as const;

export const WORKFLOW_ADVANCE_EVENT_TYPES = [
  "maintenance.vendor.assigned",
  "maintenance.vendor.accepted",
  "maintenance.vendor.declined",
  "maintenance.technician.arrived",
  "maintenance.work.completed"
] as const;

export function isWorkflowTriggerEvent(eventType: string): boolean {
  return (WORKFLOW_TRIGGER_EVENT_TYPES as readonly string[]).includes(eventType);
}

export function isWorkflowAdvanceEvent(eventType: string): boolean {
  return (WORKFLOW_ADVANCE_EVENT_TYPES as readonly string[]).includes(eventType);
}
