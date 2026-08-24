import { Suspense } from "react";
import { FacilityAssetsWorkspace } from "../../../../components/facility/facility-assets-workspace";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FacilityAssetsWorkspace />
    </Suspense>
  );
}
