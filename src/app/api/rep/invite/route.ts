import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["lukerichards@ventzon.com", "lukerichardsschool@gmail.com"];

// GET: validate an invite token
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: invite } = await admin
      .from("rep_invites")
      .select("*")
      .eq("token", token)
      .single();

    if (!invite) return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
    if (invite.used_at) return NextResponse.json({ error: "This invite has already been used." }, { status: 410 });
    if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: "This invite has expired." }, { status: 410 });

    return NextResponse.json({ invite: { email: invite.email, full_name: invite.full_name } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: create an invite (admin only) OR accept an invite
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept invite flow: { token, password }
    if (body.token && body.password) {
      const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

      const { data: invite } = await admin
        .from("rep_invites")
        .select("*")
        .eq("token", body.token)
        .single();

      if (!invite) return NextResponse.json({ error: "Invalid invite." }, { status: 404 });
      if (invite.used_at) return NextResponse.json({ error: "Already used." }, { status: 410 });
      if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: "Expired." }, { status: 410 });

      // Create Supabase auth user
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: invite.email,
        password: body.password,
        email_confirm: true,
        user_metadata: { full_name: invite.full_name },
      });

      if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

      // Create rep profile
      await admin.from("rep_profiles").insert({
        user_id: authData.user.id,
        email: invite.email,
        full_name: invite.full_name,
        invited_by_email: invite.invited_by_email,
      });

      // Mark invite used
      await admin.from("rep_invites").update({ used_at: new Date().toISOString() }).eq("token", body.token);

      return NextResponse.json({ ok: true });
    }

    // Create invite flow: { email, full_name } — admin only
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email ?? "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, full_name } = body;
    if (!email || !full_name) return NextResponse.json({ error: "Email and name required" }, { status: 400 });

    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data: invite, error } = await admin
      .from("rep_invites")
      .insert({ email, full_name, invited_by_email: user.email })
      .select("token")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ token: invite.token });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
