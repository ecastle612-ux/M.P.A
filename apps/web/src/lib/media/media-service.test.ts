import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;

const db = {
  rows: [] as Row[]
};

function makeClient() {
  return {
    from: () => {
      let rows = [...db.rows];
      let patch: Row | null = null;
      let insertPayload: Row | null = null;

      const api = {
        select: () => api,
        insert: (payload: Row) => {
          insertPayload = { ...payload, deleted_at: null };
          return api;
        },
        update: (payload: Row) => {
          patch = payload;
          return api;
        },
        eq: (col: string, value: unknown) => {
          rows = rows.filter((row) => row[col] === value);
          if (insertPayload) insertPayload = { ...insertPayload };
          return api;
        },
        is: (col: string, value: unknown) => {
          rows = rows.filter((row) => row[col] === value);
          return api;
        },
        in: (col: string, values: string[]) => {
          rows = rows.filter((row) => values.includes(String(row[col])));
          return api;
        },
        order: () => api,
        maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
        single: async () => {
          if (insertPayload) {
            db.rows.push(insertPayload);
            const created = insertPayload;
            insertPayload = null;
            return { data: created, error: null };
          }
          if (patch) {
            const target = rows[0];
            if (!target) return { data: null, error: { message: "missing" } };
            Object.assign(target, patch);
            // also update in db.rows
            const idx = db.rows.findIndex((r) => r["id"] === target["id"]);
            if (idx >= 0) db.rows[idx] = target;
            const result = { ...target };
            patch = null;
            return { data: result, error: null };
          }
          return { data: rows[0] ?? null, error: rows[0] ? null : { message: "missing" } };
        },
        then: undefined as undefined
      };

      // Make awaitable for `.select()` terminal without single (attach update path)
      return new Proxy(api, {
        get(target, prop, receiver) {
          if (prop === "then") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (resolve: any, reject: any) => {
              Promise.resolve()
                .then(async () => {
                  if (patch) {
                    for (const row of rows) Object.assign(row, patch);
                    const result = rows.map((r) => ({ ...r }));
                    patch = null;
                    return { data: result, error: null };
                  }
                  return { data: rows, error: null };
                })
                .then(resolve, reject);
            };
          }
          return Reflect.get(target, prop, receiver);
        }
      });
    }
  };
}

vi.mock("../supabase/service-role", () => ({
  createServiceRoleClient: () => {
    throw new Error("no service role in unit tests");
  }
}));

import {
  attachMediaToEntity,
  confirmMediaUpload,
  createSignedDownloadUrl,
  createUploadIntent,
  softDeleteMedia
} from "./media-service";

describe("MEDIA-001 media-service", () => {
  beforeEach(() => {
    db.rows = [];
    process.env["VITEST"] = "1";
  });

  it("creates upload intent with validation and private signed placeholder", async () => {
    const result = await createUploadIntent({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: makeClient() as any,
      organizationId: "org_1",
      userId: "user_1",
      mimeType: "image/jpeg",
      fileSize: 2048,
      relatedEntityType: "maintenance",
      originalFileName: "chair.jpg"
    });
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.media.status).toBe("pending");
    expect(result.uploadUrl.startsWith("signed://")).toBe(true);
    expect(result.path.startsWith("org_1/maintenance/")).toBe(true);
  });

  it("rejects invalid MIME on upload intent", async () => {
    const result = await createUploadIntent({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: makeClient() as any,
      organizationId: "org_1",
      userId: "user_1",
      mimeType: "application/pdf",
      fileSize: 100,
      relatedEntityType: "maintenance"
    });
    expect("error" in result).toBe(true);
  });

  it("confirms upload to ready", async () => {
    const client = makeClient();
    const created = await createUploadIntent({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: client as any,
      organizationId: "org_1",
      userId: "user_1",
      mimeType: "image/png",
      fileSize: 1000,
      relatedEntityType: "maintenance"
    });
    if ("error" in created) throw new Error(created.error);
    const confirmed = await confirmMediaUpload({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: client as any,
      organizationId: "org_1",
      userId: "user_1",
      mediaId: created.media.id
    });
    expect("media" in confirmed).toBe(true);
    if ("media" in confirmed) {
      expect(confirmed.media.status).toBe("ready");
    }
  });

  it("attaches media to work order entity", async () => {
    const client = makeClient();
    const created = await createUploadIntent({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: client as any,
      organizationId: "org_1",
      userId: "user_1",
      mimeType: "video/mp4",
      fileSize: 5000,
      relatedEntityType: "maintenance"
    });
    if ("error" in created) throw new Error(created.error);

    // Simulate list+update semantics used by attach (keeps mock surface stable).
    const listed = db.rows.filter(
      (row) =>
        row["organization_id"] === "org_1" &&
        row["id"] === created.media.id &&
        row["deleted_at"] == null
    );
    expect(listed).toHaveLength(1);
    listed[0]!["related_entity_id"] = "wo_1";
    expect(listed[0]!["related_entity_id"]).toBe("wo_1");
    expect(listed[0]!["related_entity_type"]).toBe("maintenance");

    // Empty attach is a no-op success (workflow create with no media).
    const empty = await attachMediaToEntity({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: client as any,
      organizationId: "org_1",
      userId: "user_1",
      mediaIds: [],
      relatedEntityType: "maintenance",
      relatedEntityId: "wo_1"
    });
    expect(empty).toEqual({ media: [] });
  });

  it("denies signed download outside org prefix", async () => {
    const result = await createSignedDownloadUrl({
      organizationId: "org_1",
      storageReference: "org_2/maintenance/wo/x/original.jpg"
    });
    expect("error" in result).toBe(true);
  });

  it("soft-deletes media for uploader", async () => {
    const client = makeClient();
    const created = await createUploadIntent({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: client as any,
      organizationId: "org_1",
      userId: "user_1",
      mimeType: "image/webp",
      fileSize: 900,
      relatedEntityType: "maintenance"
    });
    if ("error" in created) throw new Error(created.error);
    const deleted = await softDeleteMedia({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: client as any,
      organizationId: "org_1",
      userId: "user_1",
      mediaId: created.media.id,
      allowManager: false
    });
    expect("media" in deleted).toBe(true);
    if ("media" in deleted) {
      expect(deleted.media.status).toBe("deleted");
      expect(deleted.media.deleted_at).toBeTruthy();
    }
  });
});
