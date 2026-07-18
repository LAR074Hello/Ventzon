import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getViewerEmail(): Promise<string | null> {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    return user?.email?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

// GET /api/customer/posts/[id] → full post: media, caption, author, linked
// business + live reward, like/save/comment counts, viewer state, comments.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = adminClient();
    const viewerEmail = await getViewerEmail();

    const { data: post } = await admin
      .from("posts")
      .select("id, author_email, shop_slug, body, media_url, media_type, post_kind, created_at")
      .eq("id", id)
      .maybeSingle();
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const { data: author } = await admin
      .from("customer_profiles")
      .select("id, email, display_name, avatar_url, is_creator")
      .eq("email", post.author_email)
      .maybeSingle();

    const isOwn = !!viewerEmail && viewerEmail === post.author_email;
    // Non-creator authors are not public — only they can see their post.
    if ((!author || !author.is_creator) && !isOwn) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let shop: any = null;
    if (post.shop_slug) {
      const [{ data: setting }, { data: shopRow }] = await Promise.all([
        admin
          .from("shop_settings")
          .select("shop_slug, shop_name, deal_title, reward_goal")
          .eq("shop_slug", post.shop_slug)
          .maybeSingle(),
        admin
          .from("shops")
          .select("slug, logo_url")
          .eq("slug", post.shop_slug)
          .maybeSingle(),
      ]);
      shop = {
        slug: post.shop_slug,
        name: setting?.shop_name ?? post.shop_slug,
        logo_url: shopRow?.logo_url ?? null,
        deal_title: setting?.deal_title ?? null,
        reward_goal: setting?.reward_goal ?? 5,
      };
    }

    const [{ data: likes }, { count: saveCount }, { data: comments }] = await Promise.all([
      admin.from("post_likes").select("email").eq("post_id", id),
      admin.from("post_saves").select("id", { count: "exact", head: true }).eq("post_id", id),
      admin
        .from("post_comments")
        .select("id, email, body, created_at")
        .eq("post_id", id)
        .order("created_at", { ascending: true })
        .limit(100),
    ]);

    // Resolve commenter names via profiles; never expose raw emails.
    const commenterEmails = [...new Set((comments ?? []).map((c) => c.email))];
    const { data: commenterProfiles } = commenterEmails.length
      ? await admin
          .from("customer_profiles")
          .select("id, email, display_name, avatar_url, is_creator")
          .in("email", commenterEmails)
      : { data: [] };
    const commenterByEmail: Record<string, any> = {};
    for (const c of commenterProfiles ?? []) commenterByEmail[c.email] = c;

    let viewerSaved = false;
    let viewerProgress: { visits: number; goal: number } | null = null;
    if (viewerEmail) {
      const { data: save } = await admin
        .from("post_saves")
        .select("id")
        .eq("post_id", id)
        .eq("email", viewerEmail)
        .maybeSingle();
      viewerSaved = !!save;
      if (post.shop_slug) {
        const { data: membership } = await admin
          .from("customers")
          .select("visits")
          .eq("email", viewerEmail)
          .eq("shop_slug", post.shop_slug)
          .maybeSingle();
        if (membership) {
          viewerProgress = {
            visits: membership.visits ?? 0,
            goal: shop?.reward_goal ?? 5,
          };
        }
      }
    }

    return NextResponse.json({
      post: {
        id: post.id,
        body: post.body,
        media_url: post.media_url,
        media_type: post.media_type,
        created_at: post.created_at,
      },
      author: author
        ? {
            profile_id: author.id,
            display_name: author.display_name ?? "Creator",
            avatar_url: author.avatar_url,
          }
        : null,
      shop,
      counts: {
        likes: (likes ?? []).length,
        saves: saveCount ?? 0,
        comments: (comments ?? []).length,
      },
      viewer: {
        liked: !!viewerEmail && (likes ?? []).some((l) => l.email === viewerEmail),
        saved: viewerSaved,
        is_own: isOwn,
        progress: viewerProgress,
      },
      comments: (comments ?? []).map((c) => {
        const profile = commenterByEmail[c.email];
        return {
          id: c.id,
          body: c.body,
          created_at: c.created_at,
          author: {
            profile_id: profile?.is_creator ? profile.id : null,
            display_name: profile?.display_name ?? "Member",
            avatar_url: profile?.avatar_url ?? null,
          },
          is_own: !!viewerEmail && c.email === viewerEmail,
        };
      }),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// POST /api/customer/posts/[id] { action: like|unlike|save|unsave|comment, body? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewerEmail = await getViewerEmail();
    if (!viewerEmail) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const action = String(payload?.action ?? "");
    const admin = adminClient();

    const { data: post } = await admin
      .from("posts")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    if (action === "like") {
      const { error } = await admin
        .from("post_likes")
        .upsert({ post_id: id, email: viewerEmail }, { onConflict: "post_id,email" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (action === "unlike") {
      await admin.from("post_likes").delete().eq("post_id", id).eq("email", viewerEmail);
    } else if (action === "save") {
      const { error } = await admin
        .from("post_saves")
        .upsert({ post_id: id, email: viewerEmail }, { onConflict: "post_id,email" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (action === "unsave") {
      await admin.from("post_saves").delete().eq("post_id", id).eq("email", viewerEmail);
    } else if (action === "comment") {
      const text = String(payload?.body ?? "").trim().slice(0, 500);
      if (!text) return NextResponse.json({ error: "Comment body required" }, { status: 400 });
      const { error } = await admin
        .from("post_comments")
        .insert({ post_id: id, email: viewerEmail, body: text });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
