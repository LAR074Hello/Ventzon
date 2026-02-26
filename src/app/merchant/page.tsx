import { redirect } from "next/navigation";

// /merchant redirects to /merchant/dashboard which handles auth,
// shop lookup, and the multi-shop selector.
export default function MerchantIndexPage() {
  redirect("/merchant/dashboard");
}
