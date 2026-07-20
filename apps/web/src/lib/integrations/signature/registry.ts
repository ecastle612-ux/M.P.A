import type { SignatureProvider } from "./contracts";
import { noopSignatureProvider } from "./noop-provider";
import { dropboxSignProvider } from "./dropbox-sign-provider";

const providers = new Map<string, SignatureProvider>([
  [noopSignatureProvider.id, noopSignatureProvider],
  [dropboxSignProvider.id, dropboxSignProvider],
  // Alias historical HelloSign env naming
  ["hellosign", dropboxSignProvider]
]);

export function resolveDefaultSignatureProviderId(): string {
  const configured = process.env["SIGNATURE_PROVIDER"]?.trim();
  if (configured) return configured === "hellosign" ? "dropbox_sign" : configured;
  return "noop";
}

export function getSignatureProvider(providerId?: string): SignatureProvider {
  const raw = providerId?.trim() || resolveDefaultSignatureProviderId();
  const id = raw === "hellosign" ? "dropbox_sign" : raw;
  const provider = providers.get(id);
  if (!provider) {
    throw new Error(`Unknown signature provider: ${id}`);
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
