export function buildLeaseDocumentText(input: {
  residentName: string;
  residentEmail: string;
  propertyName: string;
  unitLabel: string;
  rentAmount: number;
  currency: string;
  startDate: string;
  dayOfMonth: number;
  managerName?: string | null;
  organizationLabel?: string | null;
}): string {
  const rent = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: input.currency
  }).format(input.rentAmount);

  return [
    "RESIDENTIAL LEASE AGREEMENT",
    "",
    `Landlord / Manager: ${input.managerName?.trim() || input.organizationLabel || "Property Manager"}`,
    `Resident: ${input.residentName} (${input.residentEmail})`,
    `Property: ${input.propertyName}`,
    `Unit: ${input.unitLabel}`,
    `Lease start date: ${input.startDate}`,
    `Monthly rent: ${rent}`,
    `Rent due day: ${input.dayOfMonth} of each month`,
    "",
    "1. Premises. Landlord leases the Unit to Resident for residential use only.",
    "2. Term. This lease begins on the start date above and continues month-to-month until ended under applicable law or written notice.",
    "3. Rent. Resident will pay Monthly rent on or before the Rent due day each month.",
    "4. Occupancy. Only Resident and approved occupants may reside in the Unit.",
    "5. Maintenance. Resident will keep the Unit reasonably clean and promptly report needed repairs.",
    "6. Portal. After this lease is signed, Resident may use the Resident Portal for lease, rent, maintenance, and documents.",
    "",
    "By signing (electronically or offline), the parties agree to these terms.",
    "",
    "Resident signature: ______________________________     Date: __________",
    "Manager signature: _______________________________     Date: __________"
  ].join("\n");
}

export function leaseDocumentToBase64(documentBody: string): string {
  return Buffer.from(documentBody, "utf8").toString("base64");
}

/** SignWell create-document rejects .txt. HTML is a supported upload type. */
export function leaseDocumentToSignWellUpload(documentName: string, documentBody: string) {
  const escaped = documentBody
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lease agreement</title></head><body><pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${escaped}</pre></body></html>`;
  return {
    fileName: documentName.replace(/\.txt$/i, ".html"),
    fileBase64: Buffer.from(html, "utf8").toString("base64")
  };
}
