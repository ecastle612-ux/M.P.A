import { describe, expect, it } from "vitest";
import {
  parseCreateMessageInput,
  parseCreateThreadFromSourceInput,
  parseThreadMutationInput
} from "./contracts";

describe("messaging contracts", () => {
  it("parses create thread from source input", () => {
    const parsed = parseCreateThreadFromSourceInput({
      threadType: "resident_maintenance",
      sourceEntityType: "maintenance",
      sourceEntityId: "00000000-0000-4000-8000-000000000001",
      subject: "WO-100 · Leaky faucet",
      participants: [{ userId: "00000000-0000-4000-8000-000000000002", participantRole: "pm" }]
    });
    expect(parsed?.threadType).toBe("resident_maintenance");
    expect(parsed?.participants).toHaveLength(1);
  });

  it("rejects thread without participants", () => {
    expect(
      parseCreateThreadFromSourceInput({
        threadType: "resident_pm",
        sourceEntityType: "general",
        subject: "Hello",
        participants: []
      })
    ).toBeNull();
  });

  it("parses create message input with attachments", () => {
    expect(
      parseCreateMessageInput({
        body: "Photo attached.",
        visibility: "internal",
        attachmentDocumentIds: ["00000000-0000-4000-8000-000000000099"]
      })
    ).toEqual({
      body: "Photo attached.",
      visibility: "internal",
      attachmentDocumentIds: ["00000000-0000-4000-8000-000000000099"]
    });
  });

  it("parses thread mutation actions", () => {
    expect(parseThreadMutationInput({ action: "mark_read" })).toEqual({ action: "mark_read" });
    expect(parseThreadMutationInput({ action: "pin", pinned: true })).toEqual({ action: "pin", pinned: true });
  });
});
