import { describe, expect, it } from "vitest";
import {
  APPLICATION_EVENT_CATALOG,
  APPLICATION_STATUSES,
  LEASING_NOTIFICATION_CATALOG,
  LEASING_PIPELINE_SECTIONS,
  createApplicationInputSchema,
  createProspectInputSchema
} from "./index";
import { PERSON_LIFECYCLE_PATH, RESIDENT_STATUS_LABELS } from "../resident/schemas";
import { PDF_EXPORT_TEMPLATES } from "../documents/schemas";

describe("Phase 5 Sprint 1 leasing applicant lifecycle", () => {
  it("registers application workflow statuses and pipeline sections", () => {
    expect(APPLICATION_STATUSES).toContain("screening_pending");
    expect(LEASING_PIPELINE_SECTIONS).toEqual([
      "prospects",
      "applications",
      "approvals",
      "lease_signing",
      "move_ins",
      "renewals",
      "move_outs"
    ]);
  });

  it("accepts create application and prospect inputs", () => {
    const app = createApplicationInputSchema.parse({
      firstName: "Maya",
      lastName: "Chen",
      email: "maya@example.com",
      propertyId: "00000000-0000-4000-8000-000000000001",
      unitId: "00000000-0000-4000-8000-000000000002"
    });
    expect(app.firstName).toBe("Maya");
    const prospect = createProspectInputSchema.parse({
      firstName: "Maya",
      lastName: "Chen",
      email: "maya@example.com",
      propertyId: "00000000-0000-4000-8000-000000000001"
    });
    expect(prospect.email).toBe("maya@example.com");
  });

  it("registers leasing notifications and application events without provider APIs", () => {
    expect(LEASING_NOTIFICATION_CATALOG.some((n) => n.key === "leasing.application.received")).toBe(
      true
    );
    expect(APPLICATION_EVENT_CATALOG.some((e) => e.type === "application.screening_planned")).toBe(
      true
    );
  });

  it("keeps one person lifecycle path with status-only progression", () => {
    expect(PERSON_LIFECYCLE_PATH[0]).toBe("prospect");
    expect(PERSON_LIFECYCLE_PATH).toContain("applicant");
    expect(PERSON_LIFECYCLE_PATH).toContain("screening_pending");
    expect(RESIDENT_STATUS_LABELS.active).toBe("Resident");
  });

  it("prepares leasing PDF templates without redesigning the PDF engine", () => {
    for (const key of [
      "rental_application",
      "approval_letter",
      "denial_letter",
      "lease_summary",
      "move_in_checklist"
    ]) {
      expect(PDF_EXPORT_TEMPLATES).toContain(key);
    }
  });
});
