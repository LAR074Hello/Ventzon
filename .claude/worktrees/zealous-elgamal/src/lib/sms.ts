import twilio from "twilio";
import { supabaseAdmin } from "./supabase-server";

// ── Twilio client (lazy — only created when SMS_ENABLED=true) ────────────────
const SMS_ENABLED = process.env.SMS_ENABLED === "true";

const twilioClient =
  SMS_ENABLED
    ? twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
    : null;

const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER!;

// ── Types ────────────────────────────────────────────────────────────────────
export type SmsKind = "transactional" | "marketing";

export interface SendSmsInput {
  shopId: string;       // shops.id (uuid)
  to: string;           // E.164 phone
  body: string;         // message text
  kind: SmsKind;
  customerId?: string;  // customers.id (uuid), optional for logging
}

export interface SendSmsResult {
  messageId: string;    // messages.id (uuid)
  status: string;       // "sent" | "skipped" | "failed" | "opted_out"
  twilioSid?: string;
}

// ── Main entry point ─────────────────────────────────────────────────────────
/**
 * Send an SMS following the Ventzon protocol:
 *   1. Check opted_out on the customer row
 *   2. Insert a `messages` row (status = "pending")
 *   3. If SMS_ENABLED, call Twilio
 *   4. Update the messages row with final status + twilio_sid
 *
 * Returns the messages row id and final status so callers can act on it.
 */
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const { shopId, to, body, kind, customerId } = input;

  // ── 1. Opt-out check ─────────────────────────────────────────────────────
  if (customerId) {
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("opted_out")
      .eq("id", customerId)
      .single();

    if (customer?.opted_out) {
      // Still log the attempt so merchants see the skip
      const { data: msg } = await supabaseAdmin
        .from("messages")
        .insert({
          shop_id: shopId,
          customer_id: customerId,
          to_phone: to,
          body,
          kind,
          status: "opted_out",
        })
        .select("id")
        .single();

      return { messageId: msg!.id, status: "opted_out" };
    }
  }

  // ── 2. Log message as pending before attempting send ─────────────────────
  const { data: msg, error: insertErr } = await supabaseAdmin
    .from("messages")
    .insert({
      shop_id: shopId,
      customer_id: customerId ?? null,
      to_phone: to,
      body,
      kind,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !msg) {
    throw new Error(`Failed to log message: ${insertErr?.message}`);
  }

  const messageId: string = msg.id;

  // ── 3. Send via Twilio (or skip) ─────────────────────────────────────────
  if (!SMS_ENABLED || !twilioClient) {
    await supabaseAdmin
      .from("messages")
      .update({ status: "skipped" })
      .eq("id", messageId);

    return { messageId, status: "skipped" };
  }

  try {
    const twilioMsg = await twilioClient.messages.create({
      to,
      from: TWILIO_PHONE,
      body,
    });

    await supabaseAdmin
      .from("messages")
      .update({ status: "sent", twilio_sid: twilioMsg.sid })
      .eq("id", messageId);

    return { messageId, status: "sent", twilioSid: twilioMsg.sid };
  } catch (err: any) {
    console.error("[SMS] Twilio send failed", { to, error: err?.message });

    await supabaseAdmin
      .from("messages")
      .update({
        status: "failed",
        error_message: String(err?.message ?? "unknown").slice(0, 500),
      })
      .eq("id", messageId);

    return { messageId, status: "failed" };
  }
}
