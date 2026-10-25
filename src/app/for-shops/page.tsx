import { redirect } from "next/navigation";

// Short, sayable URL for calls and flyers (ventzon.com/for-shops).
export default function Page() {
  redirect("/merchant-dashboard");
}
