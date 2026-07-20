import type { ScreeningProvider } from "./contracts";
import { noopScreeningProvider } from "./noop-provider";
import { checkrScreeningProvider } from "./checkr-provider";

const providers = new Map<string, ScreeningProvider>([
  [noopScreeningProvider.id, noopScreeningProvider],
  [checkrScreeningProvider.id, checkrScreeningProvider]
]);

export function resolveDefaultScreeningProviderId(): string {
  return process.env["SCREENING_PROVIDER"]?.trim() || "noop";
}

export function getScreeningProvider(providerId?: string): ScreeningProvider {
  const id = providerId?.trim() || resolveDefaultScreeningProviderId();
  const provider = providers.get(id);
  if (!provider) {
    throw new Error(`Unknown screening provider: ${id}`);
  }
  return provider;
}

export function registerScreeningProvider(provider: ScreeningProvider): () => void {
  providers.set(provider.id, provider);
  return () => providers.delete(provider.id);
}

export function listScreeningProviders(): ScreeningProvider[] {
  return Array.from(providers.values());
}
