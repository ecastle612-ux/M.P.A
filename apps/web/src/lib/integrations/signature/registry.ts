import type { SignatureProvider } from "./contracts";
import { noopSignatureProvider } from "./noop-provider";

const providers = new Map<string, SignatureProvider>([[noopSignatureProvider.id, noopSignatureProvider]]);

export function getSignatureProvider(providerId = "noop"): SignatureProvider {
  const provider = providers.get(providerId);
  if (!provider) {
    throw new Error(`Unknown signature provider: ${providerId}`);
  }
  return provider;
}

export function registerSignatureProvider(provider: SignatureProvider): () => void {
  providers.set(provider.id, provider);
  return () => providers.delete(provider.id);
}

export function listSignatureProviders(): SignatureProvider[] {
  return Array.from(providers.values());
}
