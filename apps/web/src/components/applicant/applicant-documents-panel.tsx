"use client";

import { useState } from "react";
import { Button, Card, Input } from "@mpa/ui";
import type { VaultDocumentRecord } from "../../lib/vault/contracts";

export function ApplicantDocumentsPanel({
  applicantId,
  initialDocuments,
  canCreate
}: {
  applicantId: string;
  initialDocuments: VaultDocumentRecord[];
  canCreate: boolean;
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("id_document");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function addDocument() {
    if (!title.trim()) return;
    setError(null);
    setSubmitting(true);
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityType: "applicant",
        entityId: applicantId,
        documentType,
        title: title.trim()
      })
    });
    setSubmitting(false);
    if (!response.ok) {
      setError("Unable to add document reference");
      return;
    }
    const payload = (await response.json()) as { document: VaultDocumentRecord };
    setDocuments((current) => [payload.document, ...current]);
    setTitle("");
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Document vault</h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Track required application paperwork. Add a reference for each document you have collected.
        </p>
      </div>

      {canCreate ? (
        <div className="flex flex-wrap gap-2">
          <Input aria-label="Document title" placeholder="Document title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select
            aria-label="Document type"
            className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 text-sm"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            <option value="id_document">ID document</option>
            <option value="pay_stub">Pay stub</option>
            <option value="bank_statement">Bank statement</option>
            <option value="application_form">Application form</option>
            <option value="other">Other</option>
          </select>
          <Button type="button" disabled={submitting} onClick={() => void addDocument()}>
            Add reference
          </Button>
        </div>
      ) : null}

      {documents.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--mpa-color-border-default)] p-4 text-sm text-[var(--mpa-color-text-secondary)]">
          No documents on file. Add document references to track required paperwork.
        </p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="rounded-lg border border-[var(--mpa-color-border-default)] px-3 py-2.5">
              <p className="text-sm font-medium">{doc.title}</p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">{doc.documentType.replaceAll("_", " ")}</p>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </Card>
  );
}
