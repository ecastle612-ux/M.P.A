/**
 * Organization signature settings helpers (SIGN-002).
 * Defaults live in organization_signature_settings.metadata when unset.
 */

export type SignatureSettingsLike = {
  pm_countersign?: string | null;
  owner_required?: boolean | null;
  metadata?: unknown;
};

function readMetadata(settings: SignatureSettingsLike): Record<string, unknown> {
  const metadata = settings.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

/** Default on for Property Ops orgs (SIGN-002 A4). */
export function isMoveInAcknowledgementRequired(settings: SignatureSettingsLike): boolean {
  const value = readMetadata(settings)["move_in_acknowledgement_required"];
  return typeof value === "boolean" ? value : true;
}

/** Default on for Property Ops orgs (SIGN-002 A5). */
export function isMoveOutAcknowledgementRequired(settings: SignatureSettingsLike): boolean {
  const value = readMetadata(settings)["move_out_acknowledgement_required"];
  return typeof value === "boolean" ? value : true;
}
