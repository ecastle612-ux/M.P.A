import type { ProductSku } from "../commercial/skus";
import { skuIncludesFacilityOperations, skuIncludesPropertyManager } from "../commercial/skus";
import type { DocumentCategory } from "../documents/schemas";
import { emptyAuthoredBody, type AuthoredBody } from "./authored-body";

export const AUTHORED_TEMPLATE_IDS = [
  "blank",
  "property_inspection",
  "facility_inspection",
  "asset_inspection",
  "incident_report",
  "maintenance_checklist"
] as const;

export type AuthoredTemplateId = (typeof AUTHORED_TEMPLATE_IDS)[number];

export type TemplateSurface = "pm" | "fo" | "both";

export type AuthoredTemplate = {
  id: AuthoredTemplateId;
  title: string;
  description: string;
  category: DocumentCategory;
  surface: TemplateSurface;
  body: AuthoredBody;
};

function heading(level: 1 | 2 | 3, text: string) {
  return { type: "heading" as const, level, content: [{ text }] };
}

function paragraph(text: string) {
  return { type: "paragraph" as const, content: [{ text }] };
}

function checklist(items: string[]): AuthoredBody["blocks"][number] {
  return {
    type: "checklist",
    items: items.map((text) => ({ checked: false, content: [{ text }] }))
  };
}

export const AUTHORED_TEMPLATES: readonly AuthoredTemplate[] = [
  {
    id: "blank",
    title: "Blank document",
    description: "Empty authored document",
    category: "general",
    surface: "both",
    body: emptyAuthoredBody()
  },
  {
    id: "property_inspection",
    title: "Property inspection",
    description: "Residential unit / property walkthrough notes",
    category: "inspection",
    surface: "pm",
    body: {
      type: "doc",
      blocks: [
        heading(1, "Property inspection"),
        paragraph("Property / unit:"),
        paragraph("Inspected by:"),
        paragraph("Date:"),
        heading(2, "Findings"),
        checklist([
          "Entry and common areas reviewed",
          "Kitchen and appliances reviewed",
          "Bathrooms reviewed",
          "Safety devices checked",
          "Photos attached where needed"
        ]),
        heading(2, "Notes"),
        paragraph("")
      ]
    }
  },
  {
    id: "facility_inspection",
    title: "Facility inspection",
    description: "Facility site walkthrough notes",
    category: "inspection",
    surface: "fo",
    body: {
      type: "doc",
      blocks: [
        heading(1, "Facility inspection"),
        paragraph("Site:"),
        paragraph("Inspected by:"),
        paragraph("Date:"),
        heading(2, "Areas"),
        checklist([
          "Mechanical rooms",
          "Life safety equipment",
          "Egress paths",
          "Housekeeping / infection control",
          "Utility rooms"
        ]),
        heading(2, "Notes"),
        paragraph("")
      ]
    }
  },
  {
    id: "asset_inspection",
    title: "Asset inspection",
    description: "Single-asset condition notes (link the FAC-003 asset separately)",
    category: "inspection",
    surface: "fo",
    body: {
      type: "doc",
      blocks: [
        heading(1, "Asset inspection"),
        paragraph("Asset name / code:"),
        paragraph("Location:"),
        paragraph("Condition:"),
        heading(2, "Checks"),
        checklist([
          "Identity matches the asset record",
          "Operating as expected",
          "Filters / consumables checked",
          "Safety labels present",
          "Follow-up work required"
        ]),
        heading(2, "Notes"),
        paragraph("")
      ]
    }
  },
  {
    id: "incident_report",
    title: "Incident report",
    description: "Operational incident narrative",
    category: "compliance",
    surface: "both",
    body: {
      type: "doc",
      blocks: [
        heading(1, "Incident report"),
        paragraph("When:"),
        paragraph("Where:"),
        paragraph("Who was involved:"),
        heading(2, "What happened"),
        paragraph(""),
        heading(2, "Immediate actions"),
        paragraph(""),
        heading(2, "Follow-up"),
        paragraph("")
      ]
    }
  },
  {
    id: "maintenance_checklist",
    title: "Maintenance checklist",
    description: "Job checklist for a work order",
    category: "maintenance",
    surface: "both",
    body: {
      type: "doc",
      blocks: [
        heading(1, "Maintenance checklist"),
        paragraph("Work order:"),
        paragraph("Technician:"),
        heading(2, "Tasks"),
        checklist([
          "Arrived on site / unit",
          "Diagnosed issue",
          "Completed repair or service",
          "Tested operation",
          "Cleaned work area",
          "Resident / staff notified"
        ]),
        heading(2, "Parts used"),
        paragraph(""),
        heading(2, "Notes"),
        paragraph("")
      ]
    }
  }
];

export function isAuthoredTemplateId(value: unknown): value is AuthoredTemplateId {
  return typeof value === "string" && (AUTHORED_TEMPLATE_IDS as readonly string[]).includes(value);
}

export function getAuthoredTemplate(id: AuthoredTemplateId): AuthoredTemplate {
  const match = AUTHORED_TEMPLATES.find((template) => template.id === id);
  if (!match) {
    throw new Error(`Unknown template: ${id}`);
  }
  return match;
}

export function templatesForSku(sku: ProductSku | null): AuthoredTemplate[] {
  return AUTHORED_TEMPLATES.filter((template) => {
    if (template.surface === "both") return true;
    if (template.surface === "pm") return !sku || skuIncludesPropertyManager(sku);
    if (template.surface === "fo") return !sku || skuIncludesFacilityOperations(sku);
    return false;
  });
}
