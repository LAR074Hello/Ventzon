/**
 * src/lib/sms.ts
 *
 * Single SMS abstraction for all outbound messages.
 * Flow: opt-out check → insert log row → attempt Twilio send → update log status.
 *
 * SMS_ENABLED=false skips Twilio but still logs (useful for dev/test).
 */

import twilio from "twilio";
import { SupabaseClient } from "@supabase/supabase-js";

type SmsType = "transactional" | "marketing";

interface SendSmsParams {
  supabase: SupabaseClient;
  shopId: string;
  /** Recipient in E.164 format */
  toPhone: string;
  body: string;
  type: SmsType;
  /** Optional: link this message to a checkin row */
  checkinId?: string;
  /** Optional: link this message to a promotion row */
  promotionId?: string;
}

interface SendSmsResult {
  ok: boolean;
  messageId?: string;
  twilioSid?: string;
  skipped?: "opted_out" | "sms_disabled";
  error?: string;
}

export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { supabase, shopId, toPhone, body, type, checkinId, promotionId } =
    params;

  // 1. Opt-out check
  const { data: customer } = await supabase
    .from("customers")
    .select("opted_out")
    .eq("phone", toPhone)
    .eq("shop_id", shopId)
    .single();

  if (customer?.opted_out) {
    return { ok: true, skipped: "opted_out" };
  }

  const fromPhone = process.env.TWILIO_PHONE_NUMBER ?? "";
  const smsEnabled = process.env.SMS_ENABLED !== "false";

  // 2. Log the attempt before sending
  const { data: logRow, error: logErr } = await supabase
    .from("messages")
    .insert({
      shop_id: shopId,
      to_phone: toPhone,
      from_phone: fromPhone,
      body,
      type,
      status: "queued",
      checkin_id: checkinId ?? null,
      promotion_id: promotionId ?? null,
    })
    .select("id")
    .single();

  if (logErr || !logRow) {
    console.error("[sms] failed to log message", logErr);
    return { ok: false, error: logErr?.message ?? "Failed to log message" };
  }

  const messageId = logRow.id as string;

  // 3. Skip Twilio when SMS_ENABLED=false
  if (!smsEnabled) {
    await supabase
      .from("messages")
      .update({ status: "skipped" })
      .eq("id", messageId);

    return { ok: true, messageId, skipped: "sms_disabled" };
  }

  // 4. Send via Twilio
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const msg = await client.messages.create({
      to: toPhone,
      from: fromPhone,
      body,
    });

    await supabase
      .from("messages")
      .update({ status: "sent", twilio_sid: msg.sid })
      .eq("id", messageId);

    return { ok: true, messageId, twilioSid: msg.sid };
  } catch (err: any) {
    const errMsg: string = err?.message ?? "Twilio error";

    await supabase
      .from("messages")
      .update({ status: "failed", error_message: errMsg })
      .eq("id", messageId);

    console.error("[sms] twilio send failed", errMsg);
    return { ok: false, messageId, error: errMsg };
  }
}
