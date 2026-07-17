import { describe, expect, it } from "vitest";
import { parseRunPromptInput, PROMPT_LIBRARY } from "./contracts";

describe("ai contracts", () => {
  it("parses prompt key input", () => {
    expect(parseRunPromptInput({ promptKey: "show_vacant_units" })?.promptKey).toBe("show_vacant_units");
  });

  it("parses custom message input", () => {
    expect(parseRunPromptInput({ message: "How is occupancy?" })?.message).toBe("How is occupancy?");
  });

  it("rejects empty payload", () => {
    expect(parseRunPromptInput({})).toBeNull();
  });

  it("includes built-in prompt library entries", () => {
    expect(PROMPT_LIBRARY.length).toBeGreaterThanOrEqual(8);
    expect(PROMPT_LIBRARY.some((p) => p.key === "draft_announcement")).toBe(true);
  });
});
