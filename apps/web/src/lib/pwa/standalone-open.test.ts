import { describe, expect, it } from "vitest";
import {
  classifyStandaloneHref,
  guessKindFromContentType,
  hrefForInAppPreview,
  isAppOriginHref
} from "./standalone-open";

describe("PMX-004 Phase 4 standalone open classification", () => {
  it("classifies PDF and image extensions", () => {
    expect(classifyStandaloneHref("https://cdn.example/file.pdf")).toBe("pdf");
    expect(classifyStandaloneHref("/files/photo.png")).toBe("image");
  });

  it("classifies same-origin reporting downloads as PDF", () => {
    expect(classifyStandaloneHref("/api/reporting/versions/v1/download?propertyId=p")).toBe("pdf");
  });

  it("treats unknown absolute https as external", () => {
    expect(classifyStandaloneHref("https://checkout.stripe.com/c/pay/cs_test")).toBe("external");
  });

  it("detects app-origin relative hrefs", () => {
    expect(isAppOriginHref("/settings/billing")).toBe(true);
    expect(isAppOriginHref("//evil.example")).toBe(false);
  });

  it("maps content types to kinds", () => {
    expect(guessKindFromContentType("application/pdf", "/x")).toBe("pdf");
    expect(guessKindFromContentType("image/png", "/x")).toBe("image");
  });
});
