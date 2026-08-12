/** Shared confirmation copy for high-impact actions (PPS1-004). */

export function workOrderCancelConfirmation(input: {
  title: string;
  statusLabel?: string;
}): {
  title: string;
  what: string;
  when: string;
  irreversible: string;
} {
  return {
    title: "Cancel this work order?",
    what: `“${input.title}” will move to Cancelled${
      input.statusLabel ? ` from ${input.statusLabel}` : ""
    }. Assignees and related parties may be notified.`,
    when: "This takes effect immediately when you confirm.",
    irreversible:
      "Cancellation changes the work-order lifecycle. You cannot undo this from the same action — a new work order would be required later."
  };
}

export function workOrderCompleteConfirmation(input: { title: string }): {
  title: string;
  what: string;
  when: string;
  irreversible: string;
} {
  return {
    title: "Complete and close this work order?",
    what: `“${input.title}” will be marked completed and closed.`,
    when: "This takes effect immediately when you confirm.",
    irreversible:
      "Closing finished work removes it from the open queue. Re-opening requires a new operational follow-up if more work is needed."
  };
}

export function applicationDenyConfirmation(input: { applicantName: string }): {
  title: string;
  what: string;
  when: string;
  irreversible: string;
} {
  return {
    title: "Deny this application?",
    what: `The application for ${input.applicantName} will be denied.`,
    when: "This takes effect immediately when you confirm.",
    irreversible:
      "Denial changes the leasing pipeline status. The applicant will no longer proceed in this application."
  };
}
