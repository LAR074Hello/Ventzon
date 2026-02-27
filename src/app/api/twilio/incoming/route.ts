import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * POST /api/twilio/incoming
 *
 * Twilio sends incoming SMS here. We handle:
 *   STOP / UNSUBSCRIBE → mark customer as opted_out = true
 *   START / SUBSCRIBE  → mark customer as opted_out = false
 *
 * Twilio's built-in Advanced Opt-Out already blocks outbound messages
 * to numbers that text STOP, but this keeps our DB in sync so we
 * don't waste API calls attempting to send to opted-out numbers.
 *
 * Configure in Twilio Console → Phone Numbers → your number →
 *   Messaging → "A message comes in" → Webhook → POST →
 *   https://yourdomain.com/api/twilio/incoming
 */
export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("<Response/>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Twilio sends form-encoded data
  const formData = await req.formData();
  const from = String(formData.get("From") ?? "").trim();
  const body = String(formData.get("Body") ?? "").trim().toUpperCase();

  if (!from) {
    return new Response("<Response/>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const STOP_WORDS = ["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];
  const START_WORDS = ["START", "SUBSCRIBE", "UNSTOP"];

  if (STOP_WORDS.includes(body)) {
    // Opt out all customer rows for this phone number
    await supabase
      .from("customers")
      .update({ opted_out: true })
      .eq("phone", from);

    console.log("[twilio/incoming] opted out:", from);
  } else if (START_WORDS.includes(body)) {
    // Opt back in
    await supabase
      .from("customers")
      .update({ opted_out: false })
      .eq("phone", from);

    console.log("[twilio/incoming] opted back in:", from);
  }

  // Return empty TwiML — we don't auto-reply (Twilio handles STOP replies)
  return new Response("<Response/>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
