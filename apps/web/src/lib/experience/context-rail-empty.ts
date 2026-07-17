/** Human-friendly empty copy for context rail sections — client-safe, no server imports. */

export const CONTEXT_RAIL_EMPTY = {
  property: {
    activeLeases: "No active leases yet. Create a lease when a tenant is ready to move in.",
    openMaintenance: "No open requests. Log maintenance when repairs are needed.",
    recentActivity: "Updates appear here as units and tenants change."
  },
  tenant: {
    payments: "No payments recorded yet. Charges appear after a lease is active.",
    maintenance: "No open maintenance requests for this tenant.",
    timeline: "Move-in dates, lease updates, and messages will appear here."
  },
  lease: {
    documents: "Upload lease documents when you're ready — they'll live here for quick reference.",
    timeline: "Sign, activate, and renewal events will appear here as the lease progresses."
  },
  vendor: {
    workOrders: "No assignments yet. Assign this vendor from a maintenance request.",
    recentActivity: "Assignment and completion updates will appear here."
  },
  maintenance: {
    timeline: "Status changes and notes will build a timeline as work progresses.",
    relatedHistory: "Past requests at this property will appear here over time."
  },
  financial: {
    payments: "Record a payment when funds are received — it applies here immediately.",
    expenses: "Related expenses for this property will appear as you record them."
  }
} as const;
