import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

const REASONS = ["spam", "harassment", "inappropriate", "other"] as const;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "lukerichardsschool@gmail.com";

// POST /api/customer/report { target_type: post|comment|profile,
// target_id, reason }. Reported posts/comments are hidden immediately,
// pending review; every report emails the admin.
export async function POST(req: Request) {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const targetType = String(body?.target_type ?? "");
    const targetId = String(body?.target_id ?? "").trim();
    const reason = REASONS.includes(body?.reason) ? body.reason : "other";
    if (!["post", "comment", "profile"].includes(targetType) || !targetId) {
      return NextResponse.json({ error: "Invalid report" }, { status: 400 });
    }

    const admin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await admin.from("reports").insert({
      reporter_email: user.email.toLowerCase(),
      target_type: targetType,
      target_id: targetId,
      reason,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Hide reported content immediately, pending review.
    if (targetType === "post") {
      await admin.from("posts").update({ hidden: true }).eq("id", targetId);
    } else if (targetType === "comment") {
      await admin.from("post_comments").update({ hidden: true }).eq("id", targetId);
    }

    // Route to the admin inbox. Non-fatal for the reporter — the report
    // is already saved and the content already hidden — but a failure to
    // reach the moderator must be loud, not swallowed.
    let adminNotified = true;
    try {
      await sendEmail(
        ADMIN_EMAIL,
        `[Ventzon report] ${targetType} · ${reason}`,
        `A ${targetType} was reported.\n\nType: ${targetType}\nID: ${targetId}\nReason: ${reason}\n\nThe content is hidden pending review. Review in Supabase (reports table, status=open).`
      );
    } catch (err: any) {
      adminNotified = false;
      console.error(
        `[report] ADMIN EMAIL FAILED — report is saved but nobody was alerted. ` +
          `target=${targetType}:${targetId} reason=${reason} ` +
          `err=${JSON.stringify(err?.message ?? "unknown")}`
      );
    }

    return NextResponse.json({ ok: true, admin_notified: adminNotified });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
