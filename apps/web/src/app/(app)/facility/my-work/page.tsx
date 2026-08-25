import { Suspense } from "react";
import { FacilityMyWorkPage } from "../../../../components/facility/facility-my-work-page";

export default function FacilityMyWorkRoute() {
  return (
    <Suspense fallback={<main className="p-6 text-sm">Loading My Work…</main>}>
      <FacilityMyWorkPage />
    </Suspense>
  );
}
