import { describe, expect, it } from "vitest";
import {
  buildFacilityAttentionSections,
  countFacilityAttentionItems,
  facilityMyWorkOrderHref,
  facilityOperationsWorkOrderHref,
  formatFacilityAttentionLocation,
  formatFacilityAttentionReference
} from "./mission-control-attention";

describe("facility mission-control attention (FO-EFF Slice 2)", () => {
  const now = new Date("2026-08-18T15:00:00.000Z");

  it("builds actionable overdue / unassigned / public / due-today / urgent sections", () => {
    const sections = buildFacilityAttentionSections(
      [
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          title: "Broken exam chair",
          status: "assigned",
          priority: "normal",
          assignee_type: "technician",
          technician_user_id: "tech-1",
          due_at: "2026-08-16T12:00:00.000Z",
          submitted_at: "2026-08-15T12:00:00.000Z",
          intake_channel: "internal",
          request_number: null,
          property_properties: { name: "Main Clinic" },
          floor_label: "Floor 3",
          department_label: "Cardiology",
          room_label: null,
          facility_asset_label: null
        },
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
          title: "Leaking sink",
          status: "submitted",
          priority: "normal",
          assignee_type: "unassigned",
          due_at: null,
          submitted_at: "2026-08-18T14:42:00.000Z",
          intake_channel: "qr",
          request_number: "FR-2026-00041",
          property_properties: { name: "Main Clinic" },
          floor_label: "Floor 2",
          department_label: null,
          room_label: null,
          facility_asset_label: null
        },
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
          title: "Internal paint touch-up",
          status: "submitted",
          priority: "normal",
          assignee_type: "unassigned",
          due_at: null,
          submitted_at: "2026-08-18T10:00:00.000Z",
          intake_channel: "internal",
          request_number: null,
          property_properties: { name: "Annex" },
          floor_label: null,
          department_label: null,
          room_label: null,
          facility_asset_label: null
        },
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
          title: "HVAC alarm",
          status: "triaged",
          priority: "emergency",
          assignee_type: "unassigned",
          due_at: null,
          submitted_at: "2026-08-18T13:00:00.000Z",
          intake_channel: "internal",
          request_number: null,
          property_properties: { name: "Main Clinic" },
          floor_label: null,
          department_label: null,
          room_label: null,
          facility_asset_label: null
        },
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
          title: "Filter change",
          status: "assigned",
          priority: "normal",
          assignee_type: "technician",
          technician_user_id: "tech-1",
          due_at: "2026-08-18T20:00:00.000Z",
          submitted_at: "2026-08-17T12:00:00.000Z",
          intake_channel: "internal",
          request_number: null,
          property_properties: { name: "Main Clinic" },
          floor_label: "Floor 1",
          department_label: null,
          room_label: null,
          facility_asset_label: "AHU-2"
        },
        {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6",
          title: "Closed job",
          status: "closed",
          priority: "high",
          assignee_type: "technician",
          due_at: "2026-08-10T12:00:00.000Z",
          submitted_at: "2026-08-09T12:00:00.000Z",
          intake_channel: "qr",
          request_number: "FR-OLD"
        }
      ],
      now
    );

    expect(sections.map((s) => s.category)).toEqual([
      "overdue",
      "urgent",
      "public_request",
      "unassigned",
      "due_today"
    ]);

    const overdue = sections.find((s) => s.category === "overdue")!;
    expect(overdue.items[0]?.referenceLabel).toBe("WO-aaaaaaaa");
    expect(overdue.items[0]?.locationLine).toBe("Main Clinic · Floor 3 · Cardiology");
    expect(overdue.items[0]?.href).toContain("/facility/operations?workOrderId=");
    expect(overdue.items[0]?.href).toContain("from=mission-control");
    expect(overdue.items[0]?.metaLine).toMatch(/overdue/i);

    const publicReq = sections.find((s) => s.category === "public_request")!;
    expect(publicReq.items[0]?.referenceLabel).toBe("FR-2026-00041");
    expect(publicReq.items[0]?.metaLine).toMatch(/Public request/i);

    const unassigned = sections.find((s) => s.category === "unassigned")!;
    expect(unassigned.items.some((i) => i.title === "Internal paint touch-up")).toBe(true);
    expect(unassigned.items.some((i) => i.referenceLabel === "FR-2026-00041")).toBe(false);

    const urgent = sections.find((s) => s.category === "urgent")!;
    expect(urgent.items[0]?.title).toBe("HVAC alarm");

    const dueToday = sections.find((s) => s.category === "due_today")!;
    expect(dueToday.items[0]?.title).toBe("Filter change");

    expect(countFacilityAttentionItems(sections)).toBe(5);
  });

  it("does not invent due-today without due_at", () => {
    const sections = buildFacilityAttentionSections(
      [
        {
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
          title: "No due date",
          status: "assigned",
          priority: "normal",
          assignee_type: "technician",
          technician_user_id: "t1",
          due_at: null,
          submitted_at: "2026-08-18T10:00:00.000Z",
          intake_channel: "internal"
        }
      ],
      now
    );
    expect(sections).toEqual([]);
  });

  it("formats helpers and deep-link builders", () => {
    expect(
      formatFacilityAttentionLocation({
        id: "x",
        title: "t",
        status: "submitted",
        property_properties: { name: "Clinic" },
        floor_label: "3",
        facility_asset_label: "Chair 14"
      })
    ).toBe("Clinic · 3 · Chair 14");
    expect(
      formatFacilityAttentionReference({
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        title: "t",
        status: "submitted",
        request_number: "FR-1"
      })
    ).toBe("FR-1");
    expect(facilityOperationsWorkOrderHref("wo-1")).toBe(
      "/facility/operations?workOrderId=wo-1"
    );
    expect(facilityMyWorkOrderHref("wo-1")).toBe("/facility/my-work?workOrderId=wo-1");
  });
});
