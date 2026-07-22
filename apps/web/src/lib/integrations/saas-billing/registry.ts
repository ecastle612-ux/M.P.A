import type { SaasBillingProvider } from "./contracts";
import { noopSaasBillingProvider } from "./noop-provider";
import { stripeSaasBillingProvider } from "./stripe-provider";

const providers = new Map<string, SaasBillingProvider>([
  [noopSaasBillingProvider.id, noopSaasBillingProvider],
  [stripeSaasBillingProvider.id, stripeSaasBillingProvider]
]);

export function resolveDefaultSaasBillingProviderId(): string {
  return process.env["SAAS_BILLING_PROVIDER"]?.trim() || "noop";
}

export function getSaasBillingProvider(providerId?: string): SaasBillingProvider {
  const id = providerId?.trim() || resolveDefaultSaasBillingProviderId();
  const provider = providers.get(id);
  if (!provider) {
    throw new Error(`Unknown SaaS billing provider: ${id}`);
  }
  return provider;
}

export function registerSaasBillingProvider(provider: SaasBillingProvider): () => void {
  providers.set(provider.id, provider);
  return () => providers.delete(provider.id);
}

export function listSaasBillingProviders(): SaasBillingProvider[] {
  return Array.from(providers.values());
}
