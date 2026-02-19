import { redirect } from "next/navigation";

// /merchant/create simply forwards to /get-started which handles
// authenticated shop creation. This avoids a 404 when the dashboard
// redirects users who have no shops yet.
export default function MerchantCreatePage() {
  redirect("/get-started");
}
