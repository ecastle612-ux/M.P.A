import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  userId: null as string | null,
  organizationId: "org_1" as string | null,
  allowed: false,
  entitlementOk: true
};

vi.mock("../../../../lib/media/authz", () => ({
  requireMediaActor: async () => {
    if (!state.userId) {
      return { error: new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 }) };
    }
    if (!state.allowed || !state.entitlementOk) {
      return { error: new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }) };
    }
    return {
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null })
              })
            })
          })
        })
      },
      user: { id: state.userId },
      organizationId: state.organizationId,
      roles: ["organization_admin"]
    };
  },
  assertMediaEntityAccess: async () => ({ ok: true }),
  isOrgManagerRoles: () => true
}));

vi.mock("../../../../lib/media/media-service", () => ({
  createUploadIntent: async () => ({
    media: {
      id: "media_1",
      file_type: "image",
      mime_type: "image/jpeg",
      status: "pending"
    },
    uploadUrl: "signed://media-upload/org_1/maintenance/draft/media_1/original.jpg",
    uploadToken: "t",
    path: "org_1/maintenance/draft/media_1/original.jpg",
    expiresIn: 900
  }),
  listMediaForEntity: async () => [
    {
      id: "media_1",
      file_type: "image",
      mime_type: "image/jpeg",
      file_size: 100,
      status: "ready",
      sort_order: 0,
      uploaded_by_user_id: "user_1",
      created_at: "2026-08-13T00:00:00.000Z",
      metadata: {}
    }
  ],
  attachMediaToEntity: async () => ({
    media: [{ id: "media_1", related_entity_id: "wo_1", status: "ready" }]
  })
}));

import { GET, POST as attachPost } from "./route";
import { POST as uploadIntentPost } from "./upload-intent/route";

describe("MEDIA-001 media API authorization", () => {
  beforeEach(() => {
    state.userId = null;
    state.allowed = false;
    state.entitlementOk = true;
  });

  it("denies unauthenticated upload intent", async () => {
    const response = await uploadIntentPost(
      new Request("http://localhost/api/shared/media/upload-intent", {
        method: "POST",
        body: JSON.stringify({
          mimeType: "image/jpeg",
          fileSize: 100,
          relatedEntityType: "maintenance"
        })
      })
    );
    expect(response.status).toBe(401);
  });

  it("denies unauthorized actor", async () => {
    state.userId = "user_x";
    state.allowed = false;
    const response = await uploadIntentPost(
      new Request("http://localhost/api/shared/media/upload-intent", {
        method: "POST",
        body: JSON.stringify({
          mimeType: "image/jpeg",
          fileSize: 100,
          relatedEntityType: "maintenance"
        })
      })
    );
    expect(response.status).toBe(403);
  });

  it("allows authorized upload intent", async () => {
    state.userId = "user_1";
    state.allowed = true;
    const response = await uploadIntentPost(
      new Request("http://localhost/api/shared/media/upload-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mimeType: "image/jpeg",
          fileSize: 100,
          relatedEntityType: "maintenance"
        })
      })
    );
    expect(response.status).toBe(201);
    const body = (await response.json()) as { uploadUrl: string; mediaId: string };
    expect(body.mediaId).toBe("media_1");
    expect(body.uploadUrl.includes("signed://") || body.uploadUrl.length > 0).toBe(true);
  });

  it("lists work order attachments for authorized reader", async () => {
    state.userId = "user_1";
    state.allowed = true;
    const response = await GET(
      new Request(
        "http://localhost/api/shared/media?relatedEntityType=maintenance&relatedEntityId=wo_1"
      )
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { media: Array<{ id: string }> };
    expect(body.media).toHaveLength(1);
  });

  it("attaches media ids to work order", async () => {
    state.userId = "user_1";
    state.allowed = true;
    const response = await attachPost(
      new Request("http://localhost/api/shared/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaIds: ["media_1"],
          relatedEntityType: "maintenance",
          relatedEntityId: "wo_1"
        })
      })
    );
    expect(response.status).toBe(200);
  });
});
