import { redirect } from "next/navigation";

// The live App Store build (v1.0, May 2026) predates the permission strings
// and native-shell fixes, so it is not demo-safe. Until a current build ships,
// this lands on the web app rather than on a broken store listing.
export default function DownloadPage() {
  redirect("/customer/explore");
}
