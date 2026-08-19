import { describe, expect, it } from "vitest";
import { leaseDocumentToSignWellUpload } from "./document";

describe("leaseDocumentToSignWellUpload", () => {
  it("sends HTML to SignWell instead of unsupported .txt", () => {
    const upload = leaseDocumentToSignWellUpload(
      "Lease — SignWell UAT Resident — Unit SIGNWELL-UAT.txt",
      "Resident: SignWell UAT Resident <test>"
    );
    expect(upload.fileName).toBe("Lease — SignWell UAT Resident — Unit SIGNWELL-UAT.html");
    const html = Buffer.from(upload.fileBase64, "base64").toString("utf8");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("SignWell UAT Resident &lt;test&gt;");
    expect(html).not.toContain("<test>");
  });
});
