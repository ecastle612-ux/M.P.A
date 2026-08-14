import { Suspense } from "react";
import { Skeleton } from "@mpa/ui";
import { StaffConversationsDesk } from "../../../../../../components/communications/staff-conversations-desk";

export default function Page() {
  return (
    <main className="space-y-4 p-4 md:p-6">
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
        Message tenant
      </h1>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <StaffConversationsDesk />
      </Suspense>
    </main>
  );
}
