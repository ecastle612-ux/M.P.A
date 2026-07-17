/** Guards ensuring AI never performs autonomous business actions. */
export const PROHIBITED_AUTONOMOUS_ACTIONS = [
  "publish_announcement",
  "approve_maintenance",
  "sign_lease",
  "record_payment",
  "approve_expense",
  "send_communication"
] as const;

export function assertAssistantOnlyResponse(content: string): void {
  const lower = content.toLowerCase();
  for (const action of PROHIBITED_AUTONOMOUS_ACTIONS) {
    const phrase = action.replaceAll("_", " ");
    if (lower.includes(`automatically ${phrase}`) || lower.includes(`auto-${phrase}`)) {
      throw new Error("AI responses must not claim autonomous actions.");
    }
  }
}

export function assistantFooter(): string {
  return "\n\n---\n*Draft for your review. Property managers remain in control — nothing is sent or approved automatically.*";
}
