import type { PortfolioCounts } from "./types";
import type { WorkflowSuccessConfig } from "./types";

export function buildPropertyCreatedSuccess(
  property: { id: string; name: string },
  counts: PortfolioCounts
): WorkflowSuccessConfig {
  const isFirst = counts.properties === 1;
  return {
    title: isFirst ? "First Property Created" : "Property Created",
    description: `${property.name} has been added to your portfolio.`,
    recommendations: [
      "Add units so you can track occupancy and rent.",
      "Invite team members to collaborate on this property.",
      "Review property details and financial settings."
    ],
    primaryAction: { label: "Add Units →", href: `/units/new?propertyId=${property.id}` },
    secondaryActions: [
      { label: "Add Vendor", href: "/vendors/new", variant: "secondary" },
      { label: "View Property", href: `/properties/${property.id}`, variant: "secondary" },
      { label: "Return to Dashboard", href: "/dashboard", variant: "ghost" }
    ],
    crossLinks: [
      { label: "Add Units", href: `/units/new?propertyId=${property.id}` },
      { label: "Financials", href: "/financials" },
      { label: "Maintenance", href: "/maintenance" },
      { label: "Communications", href: "/communications" }
    ],
    ...(isFirst ? { milestone: "Your portfolio journey starts here — great first step." } : {})
  };
}

export function buildUnitCreatedSuccess(
  unit: { id: string; unitNumber: string; propertyId: string },
  propertyName: string,
  counts: PortfolioCounts
): WorkflowSuccessConfig {
  const label = unit.unitNumber ? `Unit ${unit.unitNumber}` : "Your unit";
  return {
    title: "Unit Added",
    description: `${label} at ${propertyName} is ready for a tenant.`,
    recommendations: [
      counts.tenants === 0
        ? "Assign a tenant to connect someone to this unit."
        : "Create a lease to formalize occupancy and rent terms.",
      "Set rent and deposit amounts if you haven't already.",
      "Review unit availability status before move-in."
    ],
    primaryAction: {
      label: "Assign Tenant →",
      href: `/tenants/new?propertyId=${unit.propertyId}&unitId=${unit.id}`
    },
    secondaryActions: [
      {
        label: "Create Lease →",
        href: `/leases/new?propertyId=${unit.propertyId}&unitId=${unit.id}`,
        variant: "secondary"
      },
      { label: "View Unit", href: `/units/${unit.id}`, variant: "secondary" },
      { label: "Add Another Unit", href: `/units/new?propertyId=${unit.propertyId}`, variant: "ghost" }
    ],
    crossLinks: [
      { label: "Property", href: `/properties/${unit.propertyId}` },
      { label: "Add Tenant", href: `/tenants/new?propertyId=${unit.propertyId}&unitId=${unit.id}` },
      { label: "Create Lease", href: `/leases/new?propertyId=${unit.propertyId}&unitId=${unit.id}` },
      { label: "Maintenance", href: "/maintenance" }
    ]
  };
}

export function buildTenantCreatedSuccess(
  tenant: { id: string; displayName: string },
  counts: PortfolioCounts
): WorkflowSuccessConfig {
  const isFirst = counts.tenants === 1;
  return {
    title: isFirst ? "First Tenant Added" : "Tenant Ready",
    description: `${tenant.displayName} is ready to move into your portfolio.`,
    recommendations: [
      counts.leases === 0
        ? "Create a lease to formalize occupancy and rent terms."
        : "Send a welcome communication to introduce yourself.",
      "Confirm move-in date and contact details.",
      "Review unit assignment before activating the lease."
    ],
    primaryAction: { label: "Create Lease →", href: `/leases/new?tenantId=${tenant.id}` },
    secondaryActions: [
      { label: "Send Welcome Message", href: "/communications/new", variant: "secondary" },
      { label: "View Tenant", href: `/tenants/${tenant.id}`, variant: "secondary" },
      { label: "Open Dashboard", href: "/dashboard", variant: "ghost" }
    ],
    crossLinks: [
      { label: "Create Lease", href: `/leases/new?tenantId=${tenant.id}` },
      { label: "Communications", href: "/communications/new" },
      { label: "Financials", href: "/financials" },
      { label: "Maintenance", href: "/maintenance" }
    ],
    ...(isFirst ? { milestone: "Your first resident is in the system — you're building momentum." } : {})
  };
}

export function buildLeaseCreatedSuccess(lease: {
  id: string;
  leaseNumber: string;
  propertyId: string | null;
  unitId: string | null;
  primaryTenantId: string | null;
  unitNumber: string | null;
  status: string;
}): WorkflowSuccessConfig {
  const unitLabel = lease.unitNumber ? `Unit ${lease.unitNumber}` : "the unit";
  const activateFirst = lease.status === "draft" || lease.status === "signed";
  return {
    title: "Lease Saved",
    description: activateFirst
      ? `Lease ${lease.leaseNumber} is ready. Activate it when ${unitLabel} is confirmed for move-in.`
      : `Lease ${lease.leaseNumber} is set up and ready for the next step.`,
    recommendations: [
      activateFirst ? "Activate the lease when the tenant is ready to move in." : "Generate the first rent charge to start collecting.",
      "Review lease terms, dates, and deposit amounts.",
      "Send a welcome communication to the tenant."
    ],
    primaryAction: activateFirst
      ? { label: "Review & Activate →", href: `/leases/${lease.id}#lifecycle` }
      : { label: "Generate Rent Charge →", href: `/financials/charges/new?leaseId=${lease.id}` },
    secondaryActions: [
      { label: "Generate Rent Charge", href: `/financials/charges/new?leaseId=${lease.id}`, variant: "secondary" },
      { label: "View Lease", href: `/leases/${lease.id}`, variant: "secondary" },
      { label: "Open Dashboard", href: "/dashboard", variant: "ghost" }
    ],
    crossLinks: [
      ...(lease.propertyId ? [{ label: "Property", href: `/properties/${lease.propertyId}` }] : []),
      ...(lease.unitId ? [{ label: "Unit", href: `/units/${lease.unitId}` }] : []),
      ...(lease.primaryTenantId ? [{ label: "Tenant", href: `/tenants/${lease.primaryTenantId}` }] : []),
      { label: "Financials", href: "/financials" },
      { label: "Maintenance", href: "/maintenance" },
      { label: "Communications", href: "/communications" }
    ]
  };
}

export function buildVendorCreatedSuccess(vendor: {
  id: string;
  businessName: string;
  assignmentCount: number;
}): WorkflowSuccessConfig {
  return {
    title: "Vendor Added",
    description: `${vendor.businessName} is now available for maintenance assignments.`,
    recommendations: [
      vendor.assignmentCount === 0
        ? "Assign this vendor to an open work order."
        : "Review vendor performance and service areas.",
      "Confirm contact details and insurance expiration.",
      "Mark as preferred if they're a go-to contractor."
    ],
    primaryAction: { label: "Assign Work Order →", href: "/maintenance" },
    secondaryActions: [
      { label: "View Vendor", href: `/vendors/${vendor.id}`, variant: "secondary" },
      { label: "Add Another Vendor", href: "/vendors/new", variant: "ghost" },
      { label: "Open Dashboard", href: "/dashboard", variant: "ghost" }
    ],
    crossLinks: [
      { label: "Maintenance", href: "/maintenance" },
      { label: "View Vendor", href: `/vendors/${vendor.id}` },
      { label: "Financials", href: "/financials/expenses" }
    ]
  };
}

export function buildWorkOrderCreatedSuccess(workOrder: {
  id: string;
  workOrderNumber: string;
  propertyId: string | null;
  unitId: string | null;
  tenantId: string | null;
}): WorkflowSuccessConfig {
  return {
    title: "Maintenance Request Logged",
    description: `Work order ${workOrder.workOrderNumber} is open and ready for assignment.`,
    recommendations: [
      "Assign a vendor or internal staff member to handle this request.",
      "Notify the tenant that their request has been received.",
      "Set a due date if one wasn't included."
    ],
    primaryAction: { label: "Assign Vendor →", href: `/maintenance/${workOrder.id}#vendor` },
    secondaryActions: [
      { label: "Notify Tenant", href: "/communications/new", variant: "secondary" },
      { label: "View Work Order", href: `/maintenance/${workOrder.id}`, variant: "secondary" },
      { label: "Open Maintenance", href: "/maintenance", variant: "ghost" }
    ],
    crossLinks: [
      ...(workOrder.propertyId ? [{ label: "Property", href: `/properties/${workOrder.propertyId}` }] : []),
      ...(workOrder.unitId ? [{ label: "Unit", href: `/units/${workOrder.unitId}` }] : []),
      ...(workOrder.tenantId ? [{ label: "Tenant", href: `/tenants/${workOrder.tenantId}` }] : []),
      { label: "Vendors", href: "/vendors" }
    ]
  };
}

export function buildChargeCreatedSuccess(charge: {
  id: string;
  chargeNumber: string;
  leaseId: string | null;
  propertyId: string | null;
}): WorkflowSuccessConfig {
  return {
    title: "Rent Charge Created",
    description: `Charge ${charge.chargeNumber} is on the books and ready for payment.`,
    recommendations: [
      "Record a payment when funds are received.",
      "Review the charge amount and due date.",
      "Check the property ledger for outstanding balances."
    ],
    primaryAction: { label: "Record Payment →", href: `/financials/charges/${charge.id}#payment` },
    secondaryActions: [
      { label: "View Ledger", href: "/financials", variant: "secondary" },
      { label: "All Charges", href: "/financials/charges", variant: "ghost" }
    ],
    crossLinks: [
      { label: "Financial Overview", href: "/financials" },
      ...(charge.propertyId ? [{ label: "Property", href: `/properties/${charge.propertyId}` }] : []),
      ...(charge.leaseId ? [{ label: "Lease", href: `/leases/${charge.leaseId}` }] : [])
    ]
  };
}

export function buildExpenseCreatedSuccess(): WorkflowSuccessConfig {
  return {
    title: "Expense Recorded",
    description: "The expense has been logged and will appear in your property financials.",
    recommendations: [
      "Review expenses against your budget for this property.",
      "Link future expenses to work orders when applicable.",
      "Generate an owner statement when the period closes."
    ],
    primaryAction: { label: "View Expenses →", href: "/financials/expenses" },
    secondaryActions: [
      { label: "Add Another Expense", href: "/financials/expenses/new", variant: "secondary" },
      { label: "Financial Overview", href: "/financials", variant: "ghost" }
    ],
    crossLinks: [
      { label: "Financial Overview", href: "/financials" },
      { label: "Owner Statements", href: "/financials/owner-statements" },
      { label: "Rent Charges", href: "/financials/charges" }
    ]
  };
}

export function buildAnnouncementCreatedSuccess(announcement: {
  id: string;
  title: string;
}): WorkflowSuccessConfig {
  return {
    title: "Announcement Saved",
    description: `"${announcement.title}" is ready — publish when you want residents to see it.`,
    recommendations: [
      "Publish or schedule the announcement for delivery.",
      "Review targeting to confirm the right residents receive it.",
      "Check readership after publishing to track engagement."
    ],
    primaryAction: { label: "Publish Now →", href: `/communications/${announcement.id}#lifecycle` },
    secondaryActions: [
      { label: "View Timeline", href: `/communications/${announcement.id}`, variant: "secondary" },
      { label: "Send Another", href: "/communications/new", variant: "secondary" },
      { label: "All Announcements", href: "/communications", variant: "ghost" }
    ],
    crossLinks: [
      { label: "View Announcement", href: `/communications/${announcement.id}` },
      { label: "Send Another", href: "/communications/new" },
      { label: "Dashboard", href: "/dashboard" }
    ]
  };
}

export function buildStatementGeneratedSuccess(statement: {
  id: string;
  statementNumber: string;
  propertyId: string | null;
}): WorkflowSuccessConfig {
  return {
    title: "Owner Statement Generated",
    description: `Statement ${statement.statementNumber} is ready for review and delivery.`,
    recommendations: [
      "Review income, expenses, and net income for accuracy.",
      "Send the statement to the property owner when ready.",
      "Compare against prior periods to spot trends."
    ],
    primaryAction: { label: "Review Statement →", href: `/financials/owner-statements/${statement.id}` },
    secondaryActions: [
      { label: "All Statements", href: "/financials/owner-statements", variant: "secondary" },
      { label: "Financial Overview", href: "/financials", variant: "ghost" }
    ],
    crossLinks: [
      { label: "View Statement", href: `/financials/owner-statements/${statement.id}` },
      ...(statement.propertyId ? [{ label: "Property", href: `/properties/${statement.propertyId}` }] : []),
      { label: "Financial Overview", href: "/financials" }
    ]
  };
}

export function buildPropertyCreatedOnUnitFormSuccess(propertyName?: string): WorkflowSuccessConfig {
  return {
    title: "Property Created",
    description: propertyName
      ? `${propertyName} has been added. Continue by creating your first unit.`
      : "Your property has been added. Continue by creating your first unit.",
    recommendations: [
      "Add at least one unit to track occupancy.",
      "Set rent amounts and unit details.",
      "You can add more units after the first one."
    ],
    primaryAction: { label: "Continue Adding Unit →", href: "#unit-form" },
    secondaryActions: [
      { label: "Return to Dashboard", href: "/dashboard", variant: "ghost" }
    ]
  };
}

export function buildUnitCreatedOnTenantFormSuccess(): WorkflowSuccessConfig {
  return {
    title: "Unit Added",
    description: "Your unit is ready. Assign a tenant and set their move-in timeline.",
    recommendations: [
      "Enter tenant contact details and emergency contact.",
      "Confirm the correct property and unit assignment.",
      "Create a lease after the tenant is saved."
    ],
    primaryAction: { label: "Continue Adding Tenant →", href: "#tenant-form" },
    secondaryActions: [
      { label: "Return to Dashboard", href: "/dashboard", variant: "ghost" }
    ]
  };
}

export function buildPaymentRecordedSuccess(counts: PortfolioCounts): WorkflowSuccessConfig {
  const isFirst = counts.payments === 1;
  return {
    title: isFirst ? "First Payment Recorded" : "Payment Recorded",
    description: isFirst
      ? "Your first payment is on the books — the financial loop is closed."
      : "Payment has been applied to the charge.",
    recommendations: [
      "Review the updated outstanding balance.",
      "Check the property ledger for payment history.",
      "Generate an owner statement at period end."
    ],
    primaryAction: { label: "View Ledger →", href: "/financials" },
    secondaryActions: [
      { label: "All Charges", href: "/financials/charges", variant: "secondary" },
      { label: "Dashboard", href: "/dashboard", variant: "ghost" }
    ],
    ...(isFirst ? { milestone: "First payment recorded — your portfolio is generating revenue." } : {})
  };
}
