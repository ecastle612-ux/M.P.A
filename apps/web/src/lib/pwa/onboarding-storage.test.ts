import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.stubGlobal("window", {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    }
  }
});

import {
  completeOnboardingIdempotent,
  dismissOnboardingWithBackoff,
  isSetupComplete,
  markChecklist,
  onboardingStorageKey,
  readOnboardingRecord,
  shouldShowOnboardingUi
} from "./onboarding-storage";

describe("PMX-004 Phase 2 onboarding storage", () => {
  beforeEach(() => {
    store.clear();
  });

  it("namespaces by organization", () => {
    expect(onboardingStorageKey("org-a")).toBe("mpa.pwa.onboarding.v1:org-a");
    expect(onboardingStorageKey(null)).toBe("mpa.pwa.onboarding.v1:none");
  });

  it("marks checklist and completes setup without camera", () => {
    markChecklist("org-1", { installed: true, notifications: true, offlineReady: true });
    const record = readOnboardingRecord("org-1");
    expect(isSetupComplete(record.checklist)).toBe(true);
    expect(record.completed).toBe(true);
    expect(record.checklist.cameraReady).toBe(false);
  });

  it("completes idempotently", () => {
    markChecklist("org-1", { installed: true, notifications: true, offlineReady: true });
    const first = completeOnboardingIdempotent("org-1");
    const second = completeOnboardingIdempotent("org-1");
    expect(first.setupCompletedAt).toBe(second.setupCompletedAt);
    expect(shouldShowOnboardingUi("org-1")).toBe(false);
  });

  it("applies remind-later backoff", () => {
    const dismissed = dismissOnboardingWithBackoff("org-1");
    expect(dismissed.dismissCount).toBe(1);
    expect(dismissed.remindAfter).toBeGreaterThan(Date.now());
    expect(shouldShowOnboardingUi("org-1")).toBe(false);
  });
});
