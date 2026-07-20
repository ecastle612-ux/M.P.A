import { describe, expect, it } from "vitest";
import { humanizeErrorMessage, readApiError } from "./client-error";

describe("humanizeErrorMessage", () => {
  it("maps auth and permission failures", () => {
    expect(humanizeErrorMessage("JWT expired")).toMatch(/session expired/i);
    expect(humanizeErrorMessage("FORBIDDEN")).toMatch(/permission/i);
  });

  it("maps postgres-ish and provider failures", () => {
    expect(humanizeErrorMessage("duplicate key value violates unique constraint")).toMatch(/already exists/i);
    expect(humanizeErrorMessage("stripe card_declined")).toMatch(/payment/i);
    expect(humanizeErrorMessage("Error: at Object.<anonymous>")).toMatch(/our side/i);
  });

  it("readApiError prefers error string", () => {
    expect(readApiError({ error: "Unauthenticated", code: "UNAUTHENTICATED" })).toMatch(/session expired/i);
  });
});
