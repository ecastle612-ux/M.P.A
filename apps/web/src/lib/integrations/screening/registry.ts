import type { ScreeningProvider } from "./contracts";
import { noopScreeningProvider } from "./noop-provider";

const providers = new Map<string, ScreeningProvider>([[noopScreeningProvider.id, noopScreeningProvider]]);

export function getScreeningProvider(providerId = "noop"): ScreeningProvider {
  const provider = providers.get(providerId);
  if (!provider) {
    throw new Error(`Unknown screening provider: ${providerId}`);
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
