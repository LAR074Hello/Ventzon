import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/rep-utils";

export const dynamic = "force-dynamic";

/**
 * Admin moderation queue (App Store Guideline 1.2).
 *
 * Reachable only by the admin emails in lib/rep-utils. Reports land here
 * from POST /api/customer/report (which also auto-hides the content); this
 * surface is where the admin actually acts: dismiss, remove a post, remove
 * a comment, ban a user, unban. Nothing here is reachable from the customer
 * app or the marketing site — /moderation is disallowed in robots.txt.
 *
 * NOTE: ban/unban write customer_profiles.banned_at, which arrives with the
 * safety migration. Until that migration runs these two actions fail closed
 * with a clear message.
 */

function adminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin(): Promise<boolean> {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    return isAdmin(user?.email ?? null);
  } catch {
    return false;
  }
}

// Remove a post and its media from storage. Mirrors the posts DELETE route —
// a removed post whose file stays in the public bucket is a privacy leak.
async function removePost(db: SupabaseClient, postId: string) {
  const { data: post } = await db
    .from("posts")
    .select("id, author_email, media_url, poster_url")
    .eq("id", postId)
    .maybeSingle();
  if (post) {
    const uidFolder = (post.author_email ?? "").split("@")[0];
    const paths = [post.media_url, post.poster_url]
      .filter((u: unknown): u is string => typeof u === "string")
      .map((u: string) => u.split("/object/public/posts/")[1])
      .filter((p: unknown): p is string => typeof p === "string" && p.startsWith(`${uidFolder}/`))
      .filter(Boolean);
    if (paths.length) {
      try {
        await db.storage.from("posts").remove(paths);
      } catch {}
    }
    await db.from("posts").delete().eq("id", postId);
  }
}

type ReportRow = {
  id: string;
  reporter_email: string;
  target_type: "post" | "comment" | "profile";
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
};

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const db = adminClient();
    const [{ data: reports }, { data: banned }] = await Promise.all([
      db
        .from("reports")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("customer_profiles")
        .select("id, email, display_name, banned_at")
        .not("banned_at", "is", null)
        .order("banned_at", { ascending: false })
        .limit(50),
    ]);

    // Enrich reports with a preview of the target and its author, so the
    // admin can act without opening the customer app.
    const open = (reports ?? []) as ReportRow[];
    const postIds = open.filter((r) => r.target_type === "post").map((r) => r.target_id);
    const commentIds = open.filter((r) => r.target_type === "comment").map((r) => r.target_id);
    const profileIds = open.filter((r) => r.target_type === "profile").map((r) => r.target_id);

    const [{ data: posts }, { data: comments }, { data: profiles }] = await Promise.all([
      postIds.length
        ? db.from("posts").select("id, body, media_url, author_email").in("id", postIds)
        : Promise.resolve({ data: [] }),
      commentIds.length
        ? db.from("post_comments").select("id, body, email").in("id", commentIds)
        : Promise.resolve({ data: [] }),
      profileIds.length
        ? db.from("customer_profiles").select("id, email, display_name").in("id", profileIds)
        : Promise.resolve({ data: [] }),
    ]);

    const postById = new Map((posts ?? []).map((p) => [p.id, p]));
    const commentById = new Map((comments ?? []).map((c) => [c.id, c]));
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    // Author lookups for post/comment reports → needed for the Ban action.
    const authorEmails = [
      ...(posts ?? []).map((p) => p.author_email),
      ...(comments ?? []).map((c) => c.email),
    ].filter(Boolean);
    const { data: authorRows } = authorEmails.length
      ? await db
          .from("customer_profiles")
          .select("id, email, display_name")
          .in("email", authorEmails)
      : { data: [] };
    const authorByEmail = new Map((authorRows ?? []).map((a) => [a.email, a]));

    const enriched = open.map((r) => {
      if (r.target_type === "post") {
        const p = postById.get(r.target_id);
        const a = p ? authorByEmail.get(p.author_email) : null;
        return {
          ...r,
          preview: {
            text: p?.body ?? null,
            media_url: p?.media_url ?? null,
            author_email: p?.author_email ?? null,
            author_profile_id: a?.id ?? null,
            author_display_name: a?.display_name ?? null,
            gone: !p,
          },
        };
      }
      if (r.target_type === "comment") {
        const c = commentById.get(r.target_id);
        const a = c ? authorByEmail.get(c.email) : null;
        return {
          ...r,
          preview: {
            text: c?.body ?? null,
            media_url: null,
            author_email: c?.email ?? null,
            author_profile_id: a?.id ?? null,
            author_display_name: a?.display_name ?? null,
            gone: !c,
          },
        };
      }
      const prof = profileById.get(r.target_id);
      return {
        ...r,
        preview: {
          text: null,
          media_url: null,
          author_email: prof?.email ?? null,
          author_profile_id: r.target_id,
          author_display_name: prof?.display_name ?? null,
          gone: !prof,
        },
      };
    });

    return NextResponse.json({ reports: enriched, banned: banned ?? [] });
  } catch (err) {
    const e = err as { message?: string };
    return NextResponse.json(
      { error: e?.message ?? "Unknown error", hint: "ban columns may be missing — run the safety migration" },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const db = adminClient();

    switch (action) {
      case "dismiss": {
        const reportId = String(body?.report_id ?? "");
        if (!reportId) return NextResponse.json({ error: "Missing report_id" }, { status: 400 });
        await db.from("reports").update({ status: "resolved" }).eq("id", reportId);
        return NextResponse.json({ ok: true });
      }

      case "remove_post": {
        const postId = String(body?.post_id ?? "");
        if (!postId) return NextResponse.json({ error: "Missing post_id" }, { status: 400 });
        await removePost(db, postId);
        // Close any open reports about it.
        await db.from("reports").update({ status: "resolved" }).eq("target_id", postId).eq("target_type", "post");
        return NextResponse.json({ ok: true });
      }

      case "remove_comment": {
        const commentId = String(body?.comment_id ?? "");
        if (!commentId) return NextResponse.json({ error: "Missing comment_id" }, { status: 400 });
        await db.from("post_comments").delete().eq("id", commentId);
        await db.from("reports").update({ status: "resolved" }).eq("target_id", commentId).eq("target_type", "comment");
        return NextResponse.json({ ok: true });
      }

      case "ban": {
        const profileId = String(body?.profile_id ?? "");
        if (!profileId) return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });
        const { data: target } = await db.from("customer_profiles").select("id").eq("id", profileId).maybeSingle();
        if (!target) return NextResponse.json({ error: "Account not found" }, { status: 404 });
        const { error } = await db
          .from("customer_profiles")
          .update({ banned_at: new Date().toISOString() })
          .eq("id", profileId);
        if (error) {
          return NextResponse.json(
            { error: error.message, hint: "banned_at does not exist yet — run the safety migration" },
            { status: 500 }
          );
        }
        return NextResponse.json({ ok: true });
      }

      case "unban": {
        const profileId = String(body?.profile_id ?? "");
        if (!profileId) return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });
        const { error } = await db
          .from("customer_profiles")
          .update({ banned_at: null })
          .eq("id", profileId);
        if (error) {
          return NextResponse.json(
            { error: error.message, hint: "banned_at does not exist yet — run the safety migration" },
            { status: 500 }
          );
        }
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const e = err as { message?: string };
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

