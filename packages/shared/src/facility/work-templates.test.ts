import { describe, expect, it } from "vitest";
import {
  evaluateChecklistCompletion,
  ensureItemKeys,
  workTemplateSnapshotSchema
} from "./work-templates";

describe("work templates / checklist", () => {
  it("assigns keys to checklist items", () => {
    const items = ensureItemKeys([
      { sortOrder: 0, type: "checkbox", label: "Filter", required: true },
      { sortOrder: 1, type: "number", label: "Temp", required: true }
    ]);
    expect(items[0]?.key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(items[1]?.key).not.toEqual(items[0]?.key);
  });

  it("parses a snapshot", () => {
    const snapshot = workTemplateSnapshotSchema.parse({
      name: "HVAC",
      defaultTitle: "HVAC inspection",
      category: "hvac",
      priority: "normal",
      requireCompletionPhoto: true,
      items: [
        {
          key: "11111111-1111-4111-8111-111111111111",
          sortOrder: 0,
          type: "checkbox",
          label: "Filter",
          required: true
        }
      ]
    });
    expect(snapshot.requireCompletionPhoto).toBe(true);
    expect(snapshot.items).toHaveLength(1);
  });

  it("blocks complete when required checklist items are missing", () => {
    const result = evaluateChecklistCompletion({
      items: [
        {
          item_key: "a",
          label: "Inspect filter",
          item_type: "checkbox",
          required: true,
          value_boolean: null,
          value_text: null,
          value_number: null,
          value_yes_no: null,
          media_attachment_id: null
        },
        {
          item_key: "b",
          label: "Supply temperature",
          item_type: "number",
          required: true,
          value_boolean: null,
          value_text: null,
          value_number: null,
          value_yes_no: null,
          media_attachment_id: null
        }
      ],
      requireCompletionPhoto: true,
      maintenanceMediaCount: 0
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing.map((row) => row.itemKey)).toEqual(["a", "b", "__completion_photo__"]);
    }
  });

  it("allows complete when required items and photo are present", () => {
    const result = evaluateChecklistCompletion({
      items: [
        {
          item_key: "a",
          label: "Inspect filter",
          item_type: "checkbox",
          required: true,
          value_boolean: true,
          value_text: null,
          value_number: null,
          value_yes_no: null,
          media_attachment_id: null
        },
        {
          item_key: "photo",
          label: "Step photo",
          item_type: "photo",
          required: true,
          value_boolean: null,
          value_text: null,
          value_number: null,
          value_yes_no: null,
          media_attachment_id: "22222222-2222-4222-8222-222222222222"
        }
      ],
      requireCompletionPhoto: true,
      maintenanceMediaCount: 1
    });
    expect(result).toEqual({ ok: true });
  });

  it("does not rewrite historical snapshot semantics — version numbers are independent", () => {
    const v1 = workTemplateSnapshotSchema.parse({
      name: "V1",
      defaultTitle: "Job V1",
      category: "general",
      priority: "normal",
      requireCompletionPhoto: false,
      items: [
        {
          key: "11111111-1111-4111-8111-111111111111",
          sortOrder: 0,
          type: "checkbox",
          label: "Old step",
          required: true
        }
      ]
    });
    const v2 = workTemplateSnapshotSchema.parse({
      name: "V2",
      defaultTitle: "Job V2",
      category: "general",
      priority: "normal",
      requireCompletionPhoto: true,
      items: [
        {
          key: "33333333-3333-4333-8333-333333333333",
          sortOrder: 0,
          type: "text",
          label: "New step",
          required: true
        }
      ]
    });
    expect(v1.items[0]?.label).toBe("Old step");
    expect(v2.items[0]?.label).toBe("New step");
    expect(v1.requireCompletionPhoto).toBe(false);
    expect(v2.requireCompletionPhoto).toBe(true);
  });
});
