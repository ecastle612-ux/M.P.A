"use client";

import type { ValidationIssue } from "../../lib/trust/validation";

export function ValidationAlert({
  issues,
  title = "Please fix the following"
}: {
  issues: ValidationIssue[];
  title?: string;
}) {
  if (issues.length === 0) return null;

  return (
    <div
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
      role="alert"
      aria-live="assertive"
    >
      <p className="font-medium text-red-900">{title}</p>
      <ul className="mt-2 space-y-2">
        {issues.map((issue) => (
          <li key={`${issue.field ?? "form"}-${issue.what}`} className="space-y-0.5">
            <p>
              <span className="font-medium">What’s wrong: </span>
              {issue.what}
            </p>
            <p className="text-xs text-red-700/90">
              <span className="font-medium">Why: </span>
              {issue.why}
            </p>
            <p className="text-xs text-red-700/90">
              <span className="font-medium">How to fix: </span>
              {issue.howToFix}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ApiErrorAlert({
  message,
  howToFix = "Retry in a moment. If it keeps happening, check your connection or contact support."
}: {
  message: string;
  howToFix?: string;
}) {
  if (!message) return null;
  return (
    <ValidationAlert
      title="We couldn’t complete that action"
      issues={[
        {
          what: message,
          why: "The request didn’t finish successfully.",
          howToFix
        }
      ]}
    />
  );
}
