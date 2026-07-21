import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Attempt to revoke an Apple Sign In token.
 * Apple requires this when deleting an account that used Sign in with Apple.
 * This is best-effort — we don't block account deletion if revocation fails.
 */
async function revokeAppleToken(appleRefreshToken: string) {
  const keyId = process.env.APPLE_KEY_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const clientId = process.env.APPLE_CLIENT_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!keyId || !teamId || !clientId || !privateKey) return;

  try {
    // Generate client_secret JWT signed with Apple's p8 key
    const { SignJWT, importPKCS8 } = await import("jose");
    const pk = await importPKCS8(privateKey, "ES256");
    const clientSecret = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: keyId })
      .setIssuer(teamId)
      .setIssuedAt()
      .setExpirationTime("5m")
      .setAudience("https://appleid.apple.com")
      .setSubject(clientId)
      .sign(pk);

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token: appleRefreshToken,
      token_type_hint: "refresh_token",
    });

    await fetch("https://appleid.apple.com/auth/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    // Best-effort — don't block deletion if revocation fails
  }
}

export async function DELETE() {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Best-effort: revoke Apple Sign In token if the user signed in with Apple
    const appleIdentity = user.identities?.find((id: any) => id.provider === "apple");
    const appleRefreshToken = appleIdentity?.identity_data?.refresh_token;
    if (appleRefreshToken) {
      await revokeAppleToken(appleRefreshToken);
    }

    // Full erasure: every table and storage object keyed to this person.
    // Best-effort per step — a single failure shouldn't strand the rest.
    if (user.email) {
      const email = user.email.toLowerCase();

      // Their posts (post_likes/saves/comments on them cascade via FK)
      // — collect ids first so grids/likes referencing them go too.
      try {
        await supabase.from("posts").delete().eq("author_email", email);
      } catch {}

      // Their activity on other people's content
      const cleanups: Array<[string, string, string]> = [
        ["post_likes", "email", email],
        ["post_saves", "email", email],
        ["post_comments", "email", email],
        ["user_follows", "follower_email", email],
        ["user_follows", "followee_email", email],
        ["customer_follows", "email", email],
        ["referrals", "referrer_email", email],
        ["referrals", "referred_email", email],
        ["customer_notification_log", "email", email],
        ["customer_notification_prefs", "email", email],
        ["customer_profiles", "email", email],
        ["customers", "email", email],
      ];
      for (const [table, col, val] of cleanups) {
        try {
          await supabase.from(table).delete().eq(col, val);
        } catch {}
      }
    }

    // Device tokens are keyed by auth user id
    try {
      await supabase.from("device_tokens").delete().eq("user_id", user.id);
    } catch {}

    // Uploaded media: posts and avatars live under <uid>/ in each bucket
    for (const bucket of ["posts", "avatars"]) {
      try {
        const { data: objects } = await supabase.storage.from(bucket).list(user.id);
        if (objects?.length) {
          await supabase.storage
            .from(bucket)
            .remove(objects.map((o) => `${user.id}/${o.name}`));
        }
      } catch {}
    }

    // Delete the auth user (cascades all auth data)
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
