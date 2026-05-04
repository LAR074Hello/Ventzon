import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const SECRET = process.env.JOIN_TOKEN_SECRET ?? "ventzon-join-default-insecure";

export function generateUnsubscribeToken(customerId: string): string {
  return crypto.createHmac("sha256", SECRET).update(`unsub:${customerId}`).digest("hex").slice(0, 24);
}

export function verifyUnsubscribeToken(customerId: string, token: string): boolean {
  return generateUnsubscribeToken(customerId) === token;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("id");
  const token = searchParams.get("token");

  if (!customerId || !token || !verifyUnsubscribeToken(customerId, token)) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#000;color:#fff">
        <p style="color:#888">Invalid or expired unsubscribe link.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  await supabase.from("customers").update({ opted_out: true }).eq("id", customerId);

  return new NextResponse(
    `<html><body style="font-family:-apple-system,sans-serif;text-align:center;padding:80px 24px;background:#000;color:#ededed">
      <p style="font-size:13px;letter-spacing:0.3em;color:#555;margin:0">VENTZON</p>
      <h1 style="font-size:24px;font-weight:300;margin:20px 0 8px">You've been unsubscribed</h1>
      <p style="font-size:14px;font-weight:300;color:#888">You won't receive any more emails from this loyalty program.</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
