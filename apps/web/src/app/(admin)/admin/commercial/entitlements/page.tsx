import { redirect } from "next/navigation";

/** Reference shell removed from Owner Operations nav. */
export default function Page() {
  redirect("/admin/commercial/subscriptions");
}
