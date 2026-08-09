import { redirect } from "next/navigation";

/**
 * Route retained for architecture / future entitlement wiring.
 * Version 1.0 does not expose Capital Projects to customers — no UI, no copy.
 */
export default function Page() {
  redirect("/facility/mission-control");
}
