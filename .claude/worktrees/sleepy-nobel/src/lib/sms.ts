import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SendSmsOptions {
  shop_id: string;
  customer_id: string;
  to: string; // E.164
  body: string;
  message_type: "transactional" | "marketing";
}

export interface SendSmsResult {
  ok: boolean;
  message_id?: string;
  twilio_sid?: string;
  error?: string;
  skipped_opted_out?: boolean;
}

export async function sendSms(opts: SendSmsOptions): Promise<SendSmsResult> {
  const { shop_id, customer_id, to, body, message_type } = opts;

  // 1. Opt-out guard
  const { data: customer } = await supabase
    .from("customers")
    .select("opted_out")
    .eq("id", customer_id)
    .single();

  if (customer?.opted_out) {
    return { ok: false, skipped_opted_out: true };
  }

  // 2. Log message row before attempting send
  const { data: msg, error: insertErr } = await supabase
    .from("messages")
    .insert({
      shop_id,
      customer_id,
      to_phone: to,
      body,
      message_type,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !msg) {
    return { ok: false, error: insertErr?.message ?? "Failed to log message" };
  }

  const message_id = msg.id as string;

  // 3. Skip Twilio if disabled
  if (process.env.SMS_ENABLED === "false") {
    await supabase
      .from("messages")
      .update({ status: "skipped" })
      .eq("id", message_id);
    return { ok: true, message_id };
  }

  // 4. Send via Twilio
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const sent = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
      body,
    });

    await supabase
      .from("messages")
      .update({ status: "sent", twilio_sid: sent.sid })
      .eq("id", message_id);

    return { ok: true, message_id, twilio_sid: sent.sid };
  } catch (err: any) {
    await supabase
      .from("messages")
      .update({ status: "failed", error_message: err?.message ?? "Unknown" })
      .eq("id", message_id);

    return { ok: false, message_id, error: err?.message ?? "Twilio error" };
  }
}
