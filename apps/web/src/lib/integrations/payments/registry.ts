import type { PaymentProvider } from "./contracts";
import { noopPaymentProvider } from "./noop-provider";
import { stripePaymentProvider } from "./stripe-provider";

const providers = new Map<string, PaymentProvider>([
  [noopPaymentProvider.id, noopPaymentProvider],
  [stripePaymentProvider.id, stripePaymentProvider]
]);

export function resolveDefaultPaymentProviderId(): string {
  return process.env["PAYMENT_PROVIDER"]?.trim() || "noop";
}

export function getPaymentProvider(providerId?: string): PaymentProvider {
  const id = providerId?.trim() || resolveDefaultPaymentProviderId();
  const provider = providers.get(id);
  if (!provider) {
    throw new Error(`Unknown payment provider: ${id}`);
  }
  return provider;
}

export function registerPaymentProvider(provider: PaymentProvider): () => void {
  providers.set(provider.id, provider);
  return () => providers.delete(provider.id);
}

export function listPaymentProviders(): PaymentProvider[] {
  return Array.from(providers.values());
}
