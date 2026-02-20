import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const BUCKET = "logos";
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env vars" },
        { status: 500 }
      );
    }

    // Auth check
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const shop_slug = String(formData.get("shop_slug") ?? "")
      .trim()
      .toLowerCase();

    if (!shop_slug) {
      return NextResponse.json({ error: "Missing shop_slug" }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPEG, and WebP images are allowed" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 2 MB)" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify ownership
    const { data: shopRow } = await supabase
      .from("shops")
      .select("id")
      .eq("slug", shop_slug)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!shopRow) {
      return NextResponse.json(
        { error: "Shop not found or you don't own it" },
        { status: 403 }
      );
    }

    // Upload to storage (overwrite if exists)
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filePath = `${shop_slug}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadErr.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    // Save URL to shops table
    const { error: updateErr } = await supabase
      .from("shops")
      .update({ logo_url: publicUrl })
      .eq("slug", shop_slug);

    if (updateErr) {
      return NextResponse.json(
        { error: `Failed to save logo URL: ${updateErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, logo_url: publicUrl }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
