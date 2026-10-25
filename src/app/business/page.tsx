import { redirect } from "next/navigation";

// Short, sayable URL for calls and flyers (ventzon.com/business).
export default function Page() {
  redirect("/merchant-dashboard");
}
