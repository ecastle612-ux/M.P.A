import { afterEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

vi.mock("../env/server-env", () => ({
  serverEnv: {
    SIGNWELL_API_KEY: "test-signwell-key",
    SIGNWELL_WEBHOOK_ID: undefined,
    SIGNWELL_TEST_MODE: undefined
  }
}));

import { getSignWellCompletedPdfUrl, resolveSignWellExternalFileUrl } from "./client";

describe("resolveSignWellExternalFileUrl", () => {
  it("prefers files[].url when present", () => {
    expect(
      resolveSignWellExternalFileUrl({
        files: [{ name: "lease.html" }, { name: "lease.pdf", url: "https://files.example/signed.pdf" }],
        status: "Completed",
        completedPdfUrl: "https://files.example/on-demand.pdf"
      })
    ).toBe("https://files.example/signed.pdf");
  });

  it("uses completed_pdf URL when files have no url and status is completed", () => {
    expect(
      resolveSignWellExternalFileUrl({
        files: [{ name: "lease.html" }, { name: "lease.pdf" }],
        status: "Completed",
        completedPdfUrl: "https://files.example/on-demand.pdf"
      })
    ).toBe("https://files.example/on-demand.pdf");
  });

  it("does not use completed_pdf URL before completion", () => {
    expect(
      resolveSignWellExternalFileUrl({
        files: [{ name: "lease.pdf" }],
        status: "Created",
        completedPdfUrl: "https://files.example/on-demand.pdf"
      })
    ).toBeNull();
  });
});

describe("getSignWellCompletedPdfUrl", () => {
  afterEach(() => {
    fetchMock.mockReset();
  });

  it("requests completed_pdf?url_only=true and returns file_url", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ file_url: "https://files.example/on-demand.pdf" })
    });

    const url = await getSignWellCompletedPdfUrl("doc-completed");

    expect(url).toBe("https://files.example/on-demand.pdf");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestedUrl, init] = fetchMock.mock.calls[0] as [string, { headers?: Record<string, string> }];
    expect(requestedUrl).toBe(
      "https://www.signwell.com/api/v1/documents/doc-completed/completed_pdf?url_only=true"
    );
    expect(init.headers?.["X-Api-Key"]).toBe("test-signwell-key");
  });

  it("returns null when SignWell does not provide a file_url", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
    await expect(getSignWellCompletedPdfUrl("doc-missing")).resolves.toBeNull();
  });
});
