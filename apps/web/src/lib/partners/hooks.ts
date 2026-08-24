import { PARTNER_ANALYTICS_EVENTS, PARTNER_REF_METADATA_KEY, parsePartnerRefParam } from "@mpa/shared";
import { trackEvent } from "../observability/analytics";
import { loadPartnerDeps } from "./runtime";
import {
  recordPartnerAttribution,
  recordPartnerCommissionFromPaidInvoice,
  voidPartnerCommissionsForRefund
} from "./service";

function slugFromMeta(metadata: Record<string, string> | null | undefined): string | null {
  return parsePartnerRefParam(metadata?.[PARTNER_REF_METADATA_KEY] ?? null);
}

export async function safeAttributePartnerReferral(input: {
  organizationId: string | null | undefined;
  slug?: string | null;
  metadata?: Record<string, string> | null;
  source: string;
  customerEmail?: string | null;
}): Promise<void> {
  const organizationId = input.organizationId;
  const slug = parsePartnerRefParam(input.slug) ?? slugFromMeta(input.metadata);
  if (!organizationId || !slug) return;
  try {
    const deps = await loadPartnerDeps();
    const result = await recordPartnerAttribution(
      {
        organizationId,
        slug,
        source: input.source,
        ...(input.customerEmail !== undefined ? { customerEmail: input.customerEmail } : {})
      },
      deps
    );
    if (result.ok && result.created) {
      trackEvent({
        eventName: PARTNER_ANALYTICS_EVENTS.referred_organization_converted,
        properties: { route: input.source }
      });
    }
  } catch {
    // Attribution must never fail checkout, complimentary, or billing.
  }
}

export async function safeRecordPartnerCommission(input: {
  organizationId: string | null | undefined;
  slug?: string | null;
  metadata?: Record<string, string> | null;
  customerEmail?: string | null;
  amountPaidCents: number;
  taxCents?: number | null;
  stripeEventId: string;
  stripeInvoiceId?: string | null;
  stripeSubscriptionId?: string | null;
  complimentaryOnly?: boolean;
}): Promise<void> {
  try {
    const deps = await loadPartnerDeps();
    await recordPartnerCommissionFromPaidInvoice(
      {
        organizationId: input.organizationId ?? null,
        ...(parsePartnerRefParam(input.slug) || slugFromMeta(input.metadata)
          ? { slug: parsePartnerRefParam(input.slug) ?? slugFromMeta(input.metadata) }
          : {}),
        ...(input.customerEmail !== undefined ? { customerEmail: input.customerEmail } : {}),
        amountPaidCents: input.amountPaidCents,
        ...(input.taxCents !== undefined ? { taxCents: input.taxCents } : {}),
        stripeEventId: input.stripeEventId,
        ...(input.stripeInvoiceId !== undefined ? { stripeInvoiceId: input.stripeInvoiceId } : {}),
        ...(input.stripeSubscriptionId !== undefined
          ? { stripeSubscriptionId: input.stripeSubscriptionId }
          : {}),
        ...(input.complimentaryOnly !== undefined
          ? { complimentaryOnly: input.complimentaryOnly }
          : {})
      },
      deps
    );
  } catch {
    // Commission tracking must never fail Stripe lifecycle.
  }
}

export async function safeVoidPartnerCommissions(input: {
  organizationId?: string | null;
  stripeInvoiceId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeEventId: string;
}): Promise<void> {
  try {
    const deps = await loadPartnerDeps();
    await voidPartnerCommissionsForRefund(input, deps);
  } catch {
    // Refund voiding is tracking-only.
  }
}
