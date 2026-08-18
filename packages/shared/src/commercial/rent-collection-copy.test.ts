import { describe, expect, it } from "vitest";
import {
  ONLINE_RENT_COLLECTION_FAQS,
  ONLINE_RENT_COLLECTION_PREFERRED,
  ONLINE_RENT_COLLECTION_PRICING_LINE,
  skuIncludesOnlineRentCollection
} from "./rent-collection-copy";

describe("online rent collection copy", () => {
  it("keeps certified method choice and tenant-authorized AutoPay", () => {
    expect(ONLINE_RENT_COLLECTION_PREFERRED).toMatch(/bank payments, cards, or both/);
    expect(ONLINE_RENT_COLLECTION_PREFERRED).toMatch(/authorize AutoPay/);
    expect(ONLINE_RENT_COLLECTION_PREFERRED).toMatch(/You control the amounts/);
    expect(ONLINE_RENT_COLLECTION_PREFERRED).not.toMatch(/free processing/i);
    expect(ONLINE_RENT_COLLECTION_PREFERRED).not.toMatch(/instant ACH/i);
    expect(ONLINE_RENT_COLLECTION_PREFERRED).not.toMatch(/automatic late/i);
    expect(ONLINE_RENT_COLLECTION_PRICING_LINE).toMatch(/ACH, cards & tenant AutoPay/);
  });

  it("includes the four public FAQs without overclaiming", () => {
    expect(ONLINE_RENT_COLLECTION_FAQS).toHaveLength(4);
    expect(ONLINE_RENT_COLLECTION_FAQS[0]?.a).toMatch(/connect Stripe/);
    expect(ONLINE_RENT_COLLECTION_FAQS[1]?.a).toMatch(/cannot enroll a tenant/);
    expect(ONLINE_RENT_COLLECTION_FAQS[2]?.a).toMatch(/does not automatically invent/);
    expect(ONLINE_RENT_COLLECTION_FAQS[3]?.a).toMatch(/not part of the current product/);
  });

  it("is a Property Operations capability only", () => {
    expect(skuIncludesOnlineRentCollection("mpa_property_manager")).toBe(true);
    expect(skuIncludesOnlineRentCollection("mpa_complete_platform")).toBe(true);
    expect(skuIncludesOnlineRentCollection("mpa_facility_operations")).toBe(false);
    expect(skuIncludesOnlineRentCollection(null)).toBe(false);
  });
});
