import { describe, expect, it } from "vitest";
import { assertMediaEntityAccess } from "./authz";

describe("FAC-003 MEDIA-001 facility_asset parent", () => {
  it("allows an org asset and 404s a missing asset", async () => {
    const supabase = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({
                maybeSingle: async () => ({
                  data: table === "facility_assets" ? { id: "asset_1" } : null,
                  error: null
                })
              })
            })
          })
        })
      })
    };

    const allowed = await assertMediaEntityAccess({
      supabase: supabase as never,
      organizationId: "org_1",
      relatedEntityType: "facility_asset",
      relatedEntityId: "asset_1"
    });
    expect(allowed).toEqual({ ok: true });
  });

  it("returns 404 when the asset is not in the organization", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              is: () => ({
                maybeSingle: async () => ({ data: null, error: null })
              })
            })
          })
        })
      })
    };
    const denied = await assertMediaEntityAccess({
      supabase: supabase as never,
      organizationId: "org_1",
      relatedEntityType: "facility_asset",
      relatedEntityId: "missing"
    });
    expect("error" in denied).toBe(true);
    if ("error" in denied) {
      expect(denied.error.status).toBe(404);
    }
  });
});
