/**
 * UX-003 — structured client validation (presentation only).
 * Never replace server validation; clarify mistakes before submit.
 */

export type ValidationIssue = {
  field?: string;
  what: string;
  why: string;
  howToFix: string;
};

export function formatValidationIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) return "";
  if (issues.length === 1) {
    const issue = issues[0]!;
    return `${issue.what} ${issue.why} ${issue.howToFix}`;
  }
  return issues.map((issue, index) => `${index + 1}. ${issue.what} — ${issue.howToFix}`).join(" ");
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,20}$/;

export function validateRequired(value: string, fieldLabel: string): ValidationIssue | null {
  if (value.trim()) return null;
  return {
    field: fieldLabel,
    what: `${fieldLabel} is missing.`,
    why: "M.P.A. needs this field to save a complete record.",
    howToFix: `Enter a ${fieldLabel.toLowerCase()} and try again.`
  };
}

export function validateEmail(value: string, required = true): ValidationIssue | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return required
      ? {
          field: "Email",
          what: "Email is missing.",
          why: "Residents and team members are contacted through a valid email address.",
          howToFix: "Enter an email like name@example.com."
        }
      : null;
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return {
      field: "Email",
      what: "Email format looks invalid.",
      why: "Invites and notices won’t deliver to a malformed address.",
      howToFix: "Use a full address with @ and a domain (example.com)."
    };
  }
  return null;
}

export function validatePhone(value: string, required = false): ValidationIssue | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return required
      ? {
          field: "Phone",
          what: "Phone number is missing.",
          why: "Urgent maintenance and move-out contact needs a reachable number.",
          howToFix: "Enter a phone number with at least 7 digits."
        }
      : null;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || !PHONE_PATTERN.test(trimmed)) {
    return {
      field: "Phone",
      what: "Phone number looks incomplete.",
      why: "SMS and call follow-ups need a recognizable number.",
      howToFix: "Enter digits only or a formatted number like (555) 123-4567."
    };
  }
  return null;
}

export function validateNonNegativeMoney(value: string, fieldLabel: string, required = true): ValidationIssue | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return required
      ? {
          field: fieldLabel,
          what: `${fieldLabel} is missing.`,
          why: "Financial records need an amount to stay accurate.",
          howToFix: `Enter a ${fieldLabel.toLowerCase()} of 0 or greater.`
        }
      : null;
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount)) {
    return {
      field: fieldLabel,
      what: `${fieldLabel} is not a number.`,
      why: "Ledgers only accept numeric amounts.",
      howToFix: "Enter a number such as 1200 or 1200.00."
    };
  }
  if (amount < 0) {
    return {
      field: fieldLabel,
      what: `${fieldLabel} can’t be negative.`,
      why: "Negative rent or charges create incorrect balances.",
      howToFix: "Enter 0 or a positive amount. Use credits/adjustments for reductions."
    };
  }
  return null;
}

export function validatePositiveMoney(value: string, fieldLabel: string): ValidationIssue | null {
  const base = validateNonNegativeMoney(value, fieldLabel, true);
  if (base) return base;
  if (Number(value) <= 0) {
    return {
      field: fieldLabel,
      what: `${fieldLabel} must be greater than zero.`,
      why: "A zero or blank charge won’t collect payment.",
      howToFix: "Enter an amount greater than 0."
    };
  }
  return null;
}

export function validateDateOrder(
  start: string,
  end: string,
  startLabel: string,
  endLabel: string
): ValidationIssue | null {
  if (!start || !end) return null;
  if (end < start) {
    return {
      field: endLabel,
      what: `${endLabel} is before ${startLabel}.`,
      why: "Date ranges must run forward so reports and occupancy stay consistent.",
      howToFix: `Set ${endLabel.toLowerCase()} on or after ${startLabel.toLowerCase()}.`
    };
  }
  return null;
}

export function validateDuplicateValue(
  value: string,
  existing: readonly string[],
  fieldLabel: string,
  howToFix: string
): ValidationIssue | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (existing.some((entry) => entry.trim().toLowerCase() === trimmed)) {
    return {
      field: fieldLabel,
      what: `That ${fieldLabel.toLowerCase()} already exists.`,
      why: "Duplicates make search, billing, and unit assignment ambiguous.",
      howToFix
    };
  }
  return null;
}

export function firstIssue(...issues: Array<ValidationIssue | null>): ValidationIssue | null {
  for (const issue of issues) {
    if (issue) return issue;
  }
  return null;
}

export function collectIssues(...issues: Array<ValidationIssue | null>): ValidationIssue[] {
  return issues.filter((issue): issue is ValidationIssue => issue !== null);
}
