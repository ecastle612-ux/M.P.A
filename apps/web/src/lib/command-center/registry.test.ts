import { describe, expect, it } from "vitest";
import { registerCommandCenterProvider, listCommandCenterProviders } from "./registry";

describe("command center registry", () => {
  it("allows future modules to register providers without modifying core list", () => {
    const unregister = registerCommandCenterProvider({
      id: "maintenance-preview",
      category: "actions",
      sectionTitle: "Maintenance Preview",
      priority: 900,
      enabled: () => false,
      search: async () => []
    });

    expect(listCommandCenterProviders().some((provider) => provider.id === "maintenance-preview")).toBe(true);
    unregister();
    expect(listCommandCenterProviders().some((provider) => provider.id === "maintenance-preview")).toBe(false);
  });
});
