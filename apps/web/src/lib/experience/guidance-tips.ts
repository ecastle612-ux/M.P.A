export type GuidanceTipKey =
  | "lease"
  | "maintenance"
  | "financials"
  | "property"
  | "tenant"
  | "vendor"
  | "communications"
  | "ai";

export const GUIDANCE_TIPS: Record<GuidanceTipKey, string> = {
  lease: "Renewals are easiest to manage before expiration — review upcoming dates monthly.",
  maintenance: "Assigning a vendor automatically improves workflow visibility for your team and tenants.",
  financials: "Recording payments keeps owner statements accurate and builds trust with property owners.",
  property: "Add units as soon as a property is created — occupancy tracking starts there.",
  tenant: "Confirm unit assignment before creating a lease so move-in details stay connected.",
  vendor: "Mark go-to contractors as preferred so your team finds them quickly during emergencies.",
  communications: "Publish a welcome message when a new tenant moves in — it sets the tone early.",
  ai: "As your portfolio grows, M.P.A. surfaces operational insights and recommendations here."
};
