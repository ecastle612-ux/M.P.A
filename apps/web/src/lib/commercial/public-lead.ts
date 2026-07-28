/**
 * ACQ-001 Slice B — Contact Sales → COM opportunity (Enterprise path).
 */
import {
  createOpportunity,
  findOpportunityForActivation,
  updateOpportunity
} from "./opportunities";
import type { CommercialOpportunity } from "./types";

export type ContactSalesLeadInput = {
  name: string;
  workEmail: string;
  company: string;
  portfolioSize?: string | null;
  message?: string | null;
};

export async function createOrReuseContactSalesLead(
  input: ContactSalesLeadInput
): Promise<{ opportunity: CommercialOpportunity; reused: boolean }> {
  const name = input.name.trim();
  const workEmail = input.workEmail.trim().toLowerCase();
  const company = input.company.trim();
  if (!name || !workEmail.includes("@") || !company) {
    throw new Error("Name, work email, and company are required.");
  }

  const noteParts = [
    `[ACQ Contact Sales] ${name}`,
    input.portfolioSize?.trim() ? `Portfolio: ${input.portfolioSize.trim()}` : null,
    input.message?.trim() ? input.message.trim() : null
  ].filter(Boolean);

  const existing = await findOpportunityForActivation({
    contactEmail: workEmail,
    companyName: company
  });

  if (existing && !existing.organizationId && existing.stage !== "lost") {
    const opportunity = await updateOpportunity(existing.id, {
      companyName: company,
      contactEmail: workEmail,
      contactName: name,
      source: "public_contact_sales",
      planCode: "enterprise",
      notes: [existing.notes, ...noteParts].filter(Boolean).join("\n")
    });
    return { opportunity, reused: true };
  }

  const opportunity = await createOpportunity({
    companyName: company,
    contactEmail: workEmail,
    contactName: name,
    source: "public_contact_sales",
    planCode: "enterprise",
    organizationType: "property_manager",
    stage: "lead",
    notes: noteParts.join("\n")
  });
  return { opportunity, reused: false };
}
