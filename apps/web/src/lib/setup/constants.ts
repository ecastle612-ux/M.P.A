export const SETUP_STEPS = [
  "welcome",
  "profile",
  "organization",
  "invite",
  "property",
  "units",
  "tenant",
  "lease",
  "finish",
  "complete"
] as const;

export type SetupStep = (typeof SETUP_STEPS)[number];

export const SETUP_STEP_LABELS: Record<SetupStep, string> = {
  welcome: "Welcome",
  profile: "Complete Profile",
  organization: "Create Organization",
  invite: "Invite Team",
  property: "Create Property",
  units: "Add Units",
  tenant: "Create First Tenant",
  lease: "Create First Lease",
  finish: "Finish Setup",
  complete: "Setup Complete"
};

export const SETUP_INVITE_SKIPPED_KEY = "mpa.setup.invite-skipped.v1";
export const SETUP_COMPLETE_DISMISSED_KEY = "mpa.setup.complete-dismissed.v1";

export const INVITE_ROLE_TEMPLATES = [
  { label: "Organization Administrator", role: "organization_admin" as const },
  { label: "Assistant Manager", role: "property_manager" as const },
  { label: "Leasing Agent", role: "leasing_agent" as const },
  { label: "Facility Technician", role: "facility_technician" as const },
  { label: "Property Owner", role: "property_owner" as const }
];
