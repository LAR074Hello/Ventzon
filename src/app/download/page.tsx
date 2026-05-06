import { redirect } from "next/navigation";

const APP_STORE_URL = "https://apps.apple.com/app/id6763768638";

export default function DownloadPage() {
  redirect(APP_STORE_URL);
}
