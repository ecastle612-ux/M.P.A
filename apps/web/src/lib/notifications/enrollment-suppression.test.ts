import { describe, expect, it, beforeEach, vi } from "vitest";

const store = new Map<string, string>();

vi.stubGlobal("window", {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    }
  }
});

import {
  clearEnrollmentSuppression,
  isEnrollmentSuppressed,
  markEnrollmentCompleted,
  suppressEnrollmentDenied,
  suppressEnrollmentNotNow
} from "./enrollment-suppression";

describe("enrollment suppression", () => {
  beforeEach(() => {
    store.clear();
    clearEnrollmentSuppression();
  });

  it("is not suppressed by default", () => {
    expect(isEnrollmentSuppressed()).toBe(false);
  });

  it("suppresses after Not Now", () => {
    suppressEnrollmentNotNow(60_000);
    expect(isEnrollmentSuppressed()).toBe(true);
  });

  it("suppresses after deny and clears on clearEnrollmentSuppression", () => {
    suppressEnrollmentDenied();
    expect(isEnrollmentSuppressed()).toBe(true);
    markEnrollmentCompleted();
    // completed still suppresses banner (already enrolled on this browser)
    expect(isEnrollmentSuppressed()).toBe(true);
    clearEnrollmentSuppression();
    expect(isEnrollmentSuppressed()).toBe(false);
  });
});
