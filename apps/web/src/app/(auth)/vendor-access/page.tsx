import Link from "next/link";
import { Button, Card } from "@mpa/ui";

/**
 * Product correction: Vendor Portal retired.
 * Vendors are not authenticated M.P.A. users — they work via secure action links only.
 */
export default function VendorAccessPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center px-4 py-10">
      <Card className="w-full space-y-4 p-6">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Vendor access
          </h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            The Vendor Portal has been retired. Vendors are not signed-in users in M.P.A.
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Use the secure invitation or action link sent by your property manager (email or SMS) to
            accept work, update status, upload photos, add notes, or mark jobs complete.
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Property teams manage vendors in the Vendor Directory and Facility Operations inside
            M.P.A.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/login">
            <Button type="button" variant="secondary">
              Staff sign in
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
