import Link from "next/link";
import { ContextRail, ContextRailSection } from "./context-rail";
import type { SetupProgressStep } from "../../lib/setup/types";
import type { WorkflowCrossLink } from "../../lib/workflow/shared/types";

export type CreateFormModule =
  | "property"
  | "unit"
  | "tenant"
  | "lease"
  | "vendor"
  | "maintenance"
  | "financial"
  | "communication";

const MODULE_CONFIG: Record<
  CreateFormModule,
  {
    tips: string[];
    mistakes: string[];
    nextSteps: string[];
    help: string;
  }
> = {
  property: {
    tips: [
      "Use a recognizable property name — it appears across leases, maintenance, and financials.",
      "Set the correct timezone for accurate due dates and reporting.",
      "Add owner contact details now to streamline owner statements later."
    ],
    mistakes: [
      "Skipping the full address breaks geocoding and vendor dispatch context.",
      "Creating duplicate properties instead of adding units to an existing building.",
      "Leaving status as draft when the property is already operational."
    ],
    nextSteps: ["Add units to this property", "Assign tenants to units", "Create the first lease"],
    help: "Properties are the top-level container for units, tenants, leases, and financial reporting."
  },
  unit: {
    tips: [
      "Match unit numbers to physical labels on doors and mailboxes.",
      "Set occupancy status accurately — it drives vacancy reporting.",
      "Link the correct property before saving."
    ],
    mistakes: [
      "Creating units before the parent property is active.",
      "Duplicate unit numbers within the same property.",
      "Forgetting to update occupancy after move-in."
    ],
    nextSteps: ["Start guided Move in", "Confirm rent and deposit", "Activate the resident"],
    help: "Units sit between properties and tenants — every lease and charge references a unit."
  },
  tenant: {
    tips: [
      "Use preferred name for display across portals and communications.",
      "Assign property and unit together to avoid orphaned records.",
      "Capture emergency contact for after-hours maintenance."
    ],
    mistakes: [
      "Creating a tenant without linking a unit.",
      "Using a placeholder email that blocks portal enrollment.",
      "Skipping move-in date when a lease already exists."
    ],
    nextSteps: ["Prefer guided Move in for new residents", "Send a welcome announcement", "Review notification preferences"],
    help: "Tenants connect people to units, leases, payments, and maintenance requests."
  },
  lease: {
    tips: [
      "Confirm rent amount and deposit match signed documents.",
      "Set start and end dates before activating — they drive renewal alerts.",
      "Link the primary tenant before saving."
    ],
    mistakes: [
      "Activating a lease on a vacant unit without updating occupancy.",
      "Mismatched property, unit, and tenant selections.",
      "Skipping security deposit when required by policy."
    ],
    nextSteps: ["Generate the first rent charge", "Upload lease documents", "Set renewal reminders"],
    help: "Leases define the financial and legal relationship between tenant and unit."
  },
  vendor: {
    tips: [
      "List all service categories — improves work order assignment matching.",
      "Track insurance expiration to avoid compliance gaps.",
      "Mark preferred vendors for faster dispatch."
    ],
    mistakes: [
      "Duplicate vendor records for the same business.",
      "Missing contact phone for emergency dispatch.",
      "Archiving vendors with open work orders."
    ],
    nextSteps: ["Assign to an open work order", "Review performance metrics", "Update service areas"],
    help: "Vendors receive work order assignments and appear on maintenance timelines."
  },
  maintenance: {
    tips: [
      "Set priority based on tenant safety and property damage risk.",
      "Link property, unit, and tenant for full context on dispatch.",
      "Add a clear title — it appears in notifications and reports."
    ],
    mistakes: [
      "Creating work orders without a property reference.",
      "Using vague titles that slow vendor triage.",
      "Leaving due dates blank on urgent requests."
    ],
    nextSteps: ["Assign a vendor", "Notify the tenant", "Mark complete when finished"],
    help: "Work orders track maintenance from request through completion across your portfolio."
  },
  financial: {
    tips: [
      "Match charge type to the lease terms before posting.",
      "Verify due date aligns with the rent collection calendar.",
      "Link the correct lease for accurate tenant balance."
    ],
    mistakes: [
      "Duplicate charges for the same rent period.",
      "Recording payments against the wrong charge.",
      "Missing property context on expenses."
    ],
    nextSteps: ["Record a payment", "Review outstanding balance", "Generate owner statement"],
    help: "Financial records tie charges, payments, and expenses to leases and properties."
  },
  communication: {
    tips: [
      "Target the right audience — property-wide vs. organization-wide.",
      "Schedule sends during business hours for higher readership.",
      "Use a clear subject line in the preview."
    ],
    mistakes: [
      "Sending before content is reviewed.",
      "Wrong property scope for building-specific notices.",
      "Forgetting to set expiration on time-sensitive alerts."
    ],
    nextSteps: ["Review readership", "Schedule a follow-up", "Update resident preferences"],
    help: "Announcements reach tenants through email, SMS, and in-app channels."
  }
};

const DEFAULT_SETUP_STEPS: SetupProgressStep[] = [
  { id: "property", label: "Create property", complete: false },
  { id: "units", label: "Add units", complete: false },
  { id: "tenant", label: "Create tenant", complete: false },
  { id: "lease", label: "Create lease", complete: false }
];

export function CreateFormContextRail({
  module,
  setupSteps = DEFAULT_SETUP_STEPS,
  relatedLinks = [],
  tips,
  mistakes,
  nextSteps,
  helpText
}: {
  module: CreateFormModule;
  setupSteps?: SetupProgressStep[];
  relatedLinks?: WorkflowCrossLink[];
  tips?: string[];
  mistakes?: string[];
  nextSteps?: string[];
  helpText?: string;
}) {
  const config = MODULE_CONFIG[module];
  const resolvedTips = tips ?? config.tips;
  const resolvedMistakes = mistakes ?? config.mistakes;
  const resolvedNextSteps = nextSteps ?? config.nextSteps;
  const resolvedHelp = helpText ?? config.help;

  return (
    <ContextRail title="Form context">
      <ContextRailSection title="Setup checklist">
        <ul className="space-y-1.5">
          {setupSteps.map((step) => (
            <li key={step.id} className="flex items-center gap-2">
              <span
                className={[
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  step.complete
                    ? "bg-[var(--mpa-color-brand-primary)] text-[var(--mpa-color-text-inverse)]"
                    : "border border-[var(--mpa-color-border-default)] text-[var(--mpa-color-text-secondary)]"
                ].join(" ")}
                aria-hidden
              >
                {step.complete ? "✓" : "○"}
              </span>
              <span className={step.complete ? "text-[var(--mpa-color-text-muted)]" : ""}>{step.label}</span>
            </li>
          ))}
        </ul>
      </ContextRailSection>

      {relatedLinks.length > 0 ? (
        <ContextRailSection title="Related records">
          <ul className="space-y-1">
            {relatedLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </ContextRailSection>
      ) : null}

      <ContextRailSection title="AI tips">
        <ul className="space-y-1.5">
          {resolvedTips.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="shrink-0 text-[var(--mpa-color-brand-primary)]" aria-hidden>
                →
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </ContextRailSection>

      <ContextRailSection title="Common mistakes">
        <ul className="space-y-1.5">
          {resolvedMistakes.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="shrink-0 text-[var(--mpa-color-feedback-warning)]" aria-hidden>
                !
              </span>
              {item}
            </li>
          ))}
        </ul>
      </ContextRailSection>

      <ContextRailSection title="Next steps">
        <ul className="space-y-1">
          {resolvedNextSteps.map((step) => (
            <li key={step}>• {step}</li>
          ))}
        </ul>
      </ContextRailSection>

      <ContextRailSection title="Help" variant="muted">
        <p>{resolvedHelp}</p>
      </ContextRailSection>
    </ContextRail>
  );
}
