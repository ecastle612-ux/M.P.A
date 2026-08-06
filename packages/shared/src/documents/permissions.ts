import { evaluateCapability, type PermissionCapability } from "../auth/permissions";

export const DOCUMENT_CAPABILITIES = [
  "platform.documents:read",
  "platform.documents:write"
] as const;

export type DocumentCapability = (typeof DOCUMENT_CAPABILITIES)[number];

export function hasDocumentCapability(
  grantedCapabilities: readonly string[],
  required: DocumentCapability
): boolean {
  return evaluateCapability(grantedCapabilities, required as PermissionCapability);
}
