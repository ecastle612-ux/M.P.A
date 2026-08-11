import {
  COMPLETE_BASE_MONTHLY_USD,
  FO_ANNUAL_USD,
  FO_MONTHLY_USD,
  PM_BASE_MONTHLY_USD,
  UNIT_BLOCK_SIZE
} from "@mpa/shared";

/**
 * Minimal Product/Offer structured data for public pricing.
 * Does not advertise gated products as purchasable online.
 */
export function PricingJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "My Property Assistant platform pricing",
    itemListElement: [
      {
        "@type": "Product",
        name: "Property Manager",
        description: `Up to ${UNIT_BLOCK_SIZE} managed units included. Additional Unit Capacity available.`,
        offers: {
          "@type": "Offer",
          price: String(PM_BASE_MONTHLY_USD),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          description: `From $${PM_BASE_MONTHLY_USD}/month`
        }
      },
      {
        "@type": "Product",
        name: "Facility Operations",
        description: `Up to ${UNIT_BLOCK_SIZE} managed units included. Additional Unit Capacity available.`,
        offers: {
          "@type": "Offer",
          price: String(FO_MONTHLY_USD),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          description: `$${FO_MONTHLY_USD}/month or $${FO_ANNUAL_USD}/year`
        }
      },
      {
        "@type": "Product",
        name: "Complete Platform",
        description: "Not available for online purchase yet.",
        offers: {
          "@type": "Offer",
          price: String(COMPLETE_BASE_MONTHLY_USD),
          priceCurrency: "USD",
          availability: "https://schema.org/PreOrder",
          description: `From $${COMPLETE_BASE_MONTHLY_USD}/month when online`
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
