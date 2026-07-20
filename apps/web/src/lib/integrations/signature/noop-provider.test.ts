import { describe, expect, it } from "vitest";
import { noopSignatureProvider } from "./noop-provider";

describe("noop signature provider", () => {
  it("creates envelope refs without network", async () => {
    const ref = await noopSignatureProvider.createEnvelope({
      organizationId: "org",
      packageId: "pkg",
      packageNumber: "SIG-1",
      subject: "Lease",
      documents: [
        {
          title: "Lease",
          fileName: "lease.pdf",
          contentBase64: Buffer.from("x").toString("base64")
        }
      ],
      recipients: [
        {
          id: "r1",
          role: "primary_applicant",
          fullName: "Ada",
          email: "ada@example.com",
          signingOrder: 1,
          signingGroup: 1,
          isRequired: true
        }
      ]
    });
    expect(ref.externalReference).toContain("noop-env");
    const artifacts = await noopSignatureProvider.downloadExecutedDocuments(ref);
    expect(artifacts[0]?.kind).toBe("executed");
  });
});
