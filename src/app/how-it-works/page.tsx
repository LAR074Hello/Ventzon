import { redirect } from "next/navigation";

// How it works now lives on the homepage (the "One loop" section), so the
// old URL lands there instead of 404ing. Decided by Luke, 2026-10-24.
export default function HowItWorksPage() {
  redirect("/#how-it-works");
}
