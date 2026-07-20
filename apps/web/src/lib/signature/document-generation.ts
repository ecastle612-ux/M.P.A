import { createHash } from "node:crypto";
import {
  DEFAULT_LEASE_REQUIRED_FIELDS,
  DEFAULT_LEASE_TEMPLATE,
  mergeTemplate,
  missingMergeFields,
  type MergeFieldContext,
  type SignatureDocumentType
} from "./contracts";

export type GeneratedDocument = {
  title: string;
  documentType: SignatureDocumentType;
  contentText: string;
  contentHash: string;
  contentBase64: string;
  version: number;
  missingFields: string[];
};

/** Minimal single-page PDF from plain text (no external PDF SDK). */
export function buildSimplePdf(text: string): Uint8Array {
  const lines = text.replace(/\r\n/g, "\n").split("\n").slice(0, 60);
  const escaped = lines
    .map((line) => line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"))
    .join("\\n");
  const stream = `BT /F1 10 Tf 50 750 Td 14 TL (${escaped}) Tj ET`;
  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj");
  objects.push(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj"
  );
  objects.push(`4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream endobj`);
  objects.push("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${obj}\n`;
  }
  const xrefPos = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

export function hashContent(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function generateDocumentFromTemplate(input: {
  title: string;
  documentType: SignatureDocumentType;
  templateBody?: string;
  requiredFields?: string[];
  context: MergeFieldContext;
  version?: number;
  preview?: boolean;
}): GeneratedDocument {
  const template = input.templateBody ?? DEFAULT_LEASE_TEMPLATE;
  const required = input.requiredFields ?? DEFAULT_LEASE_REQUIRED_FIELDS;
  const missing = missingMergeFields(template, input.context, required);
  let contentText = mergeTemplate(template, input.context);
  if (input.preview) {
    contentText = `*** PREVIEW — NOT FOR SIGNATURE ***\n\n${contentText}`;
  }
  const pdf = buildSimplePdf(contentText);
  return {
    title: input.title,
    documentType: input.documentType,
    contentText,
    contentHash: hashContent(contentText),
    contentBase64: Buffer.from(pdf).toString("base64"),
    version: input.version ?? 1,
    missingFields: missing
  };
}
