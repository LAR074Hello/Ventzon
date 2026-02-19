import { NextResponse } from "next/server";
import { sendSms } from "@/lib/twilio";

export async function GET() {
  try {
    // put YOUR phone here (must be verified if Twilio trial)
    const to = "+14105042593";
    const result = await sendSms(to, "Ventzon test SMS ✅");
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}