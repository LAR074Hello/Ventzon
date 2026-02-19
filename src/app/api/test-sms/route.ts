import { NextResponse } from "next/server";
import twilio from "twilio";

/**
 * GET /api/test-sms?to=+14105551234
 *
 * Sends a test SMS to verify Twilio credentials are working.
 * If no `to` param, just confirms env vars are set (dry run).
 */
export async function GET(req: Request) {
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!sid || !token || !from) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing Twilio env vars",
          missing: {
            TWILIO_ACCOUNT_SID: !sid,
            TWILIO_AUTH_TOKEN: !token,
            TWILIO_PHONE_NUMBER: !from,
          },
        },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const to = url.searchParams.get("to")?.trim();

    // Dry run — just confirm env vars are set
    if (!to) {
      return NextResponse.json({
        ok: true,
        dry_run: true,
        message: "Twilio env vars are set. Pass ?to=+1XXXXXXXXXX to send a real test SMS.",
        from,
      });
    }

    // Validate E.164
    if (!/^\+\d{10,15}$/.test(to)) {
      return NextResponse.json(
        { ok: false, error: "Invalid phone (must be E.164 like +14105551234)" },
        { status: 400 }
      );
    }

    const client = twilio(sid, token);
    const msg = await client.messages.create({
      to,
      from,
      body: "Ventzon test SMS — your Twilio setup is working!",
    });

    return NextResponse.json({
      ok: true,
      message_sid: msg.sid,
      sent_to: to,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
