import { describe, expect, it, beforeEach, vi } from "vitest";
import { applyUsageRanking } from "./ranking";
import type { CommandCenterResult } from "./types";

function action(id: string, score: number): CommandCenterResult {
  return {
    id,
    kind: "action",
    category: "actions",
    label: id,
    subtitle: null,
    context: null,
    badge: "Action",
    status: null,
    statusVariant: "neutral",
    icon: "+",
    href: "/",
    shortcut: null,
    score,
    favoriteKey: id
  };
}

describe("applyUsageRanking", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        }
      }
    });
  });

  it("boosts frequently used actions above base score peers", () => {
    window.localStorage.setItem(
      "mpa_command_center_action_usage",
      JSON.stringify({ "action:record-payment": 8 })
    );

    const ranked = applyUsageRanking([
      action("action:create-property", 100),
      action("action:record-payment", 100)
    ]);

    expect(ranked[0]?.id).toBe("action:record-payment");
    expect(ranked[0]?.score ?? 0).toBeGreaterThan(ranked[1]?.score ?? 0);
  });
});
