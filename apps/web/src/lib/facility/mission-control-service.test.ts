import { describe, expect, it } from "vitest";
import { getFacilityMissionControlSnapshot } from "./mission-control-service";

function createFilterAwareClient(options: { listRows?: unknown[] }) {
  type Builder = {
    select: () => Builder;
    eq: (col: string, value: unknown) => Builder;
    then: (
      resolve: (value: { data: unknown; error: null }) => unknown,
      reject?: (reason: unknown) => unknown
    ) => Promise<unknown>;
  };

  const client: {
    lastEq: Array<[string, unknown]>;
    from: (table: string) => Builder;
  } = {
    lastEq: [],
    from: () => {
      const builder: Builder = {
        select: () => builder,
        eq: (col, value) => {
          client.lastEq.push([col, value]);
          return builder;
        },
        then: (resolve, reject) =>
          Promise.resolve({ data: options.listRows ?? [], error: null }).then(resolve, reject)
      };
      return builder;
    }
  };
  return client;
}

describe("getFacilityMissionControlSnapshot (FO-EFF Slice 2)", () => {
  it("counts open/overdue and builds manager attention in one query", async () => {
    const now = Date.now();
    const supabase = createFilterAwareClient({
      listRows: [
        {
          id: "1",
          title: "Emergency",
          status: "submitted",
          priority: "emergency",
          assignee_type: "unassigned",
          due_at: new Date(now - 60_000).toISOString(),
          submitted_at: new Date().toISOString(),
          completed_at: null,
          closed_at: null,
          intake_channel: "internal"
        },
        {
          id: "2",
          title: "Vendor",
          status: "assigned",
          priority: "normal",
          assignee_type: "vendor",
          due_at: null,
          submitted_at: new Date().toISOString(),
          completed_at: null,
          closed_at: null
        },
        {
          id: "3",
          title: "Done",
          status: "completed",
          priority: "normal",
          assignee_type: "technician",
          due_at: null,
          submitted_at: new Date(now - 2 * 24 * 3600_000).toISOString(),
          completed_at: new Date(now - 24 * 3600_000).toISOString(),
          closed_at: null
        }
      ]
    });

    const snapshot = await getFacilityMissionControlSnapshot(supabase as never, "org_1");
    expect(snapshot.emergency).toBe(1);
    expect(snapshot.open).toBe(2);
    expect(snapshot.overdue).toBe(1);
    expect(snapshot.waitingOnVendor).toBe(1);
    expect(snapshot.completedRecently).toBe(1);
    expect(snapshot.viewerMode).toBe("manager");
    expect(snapshot.attentionTotal).toBeGreaterThan(0);
    expect(supabase.lastEq).toContainEqual(["organization_id", "org_1"]);
    expect(supabase.lastEq).toContainEqual(["work_surface", "facility"]);
  });
});
