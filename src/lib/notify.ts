// Push-first customer notification with email fallback, used by the
// birthday and occasions crons. App users (a device token on file) get
// a push notification; everyone else gets an email.
import { sendPushToDeviceTokens, type PushToken } from "@/lib/push";
import { sendEmail } from "@/lib/resend";

/**
 * Build an email -> device-tokens map in bulk. Paginates the auth users
 * once to resolve email -> user id, then fetches all device tokens for
 * those users in one query. Cheap enough to call once per cron run.
 * Tokens carry their platform so push targets iOS vs Android correctly.
 */
export async function buildTokenMap(
  supabase: any,
  emails: string[]
): Promise<Record<string, PushToken[]>> {
  const wanted = new Set(
    emails.map((e) => (e || "").toLowerCase().trim()).filter(Boolean)
  );
  if (wanted.size === 0) return {};

  const emailToUid: Record<string, string> = {};
  let page = 1;
  // Stop early once we've matched everyone we care about.
  while (Object.keys(emailToUid).length < wanted.size) {
    const { data: authPage } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (!authPage?.users?.length) break;
    for (const u of authPage.users) {
      const e = u.email?.toLowerCase();
      if (e && wanted.has(e)) emailToUid[e] = u.id;
    }
    if (authPage.users.length < 1000) break;
    page++;
  }

  const uidToEmail: Record<string, string> = {};
  for (const [e, u] of Object.entries(emailToUid)) uidToEmail[u] = e;
  const uids = Object.keys(uidToEmail);

  const emailToTokens: Record<string, PushToken[]> = {};
  if (uids.length) {
    const { data: tokenRows } = await supabase
      .from("device_tokens")
      .select("user_id, token, platform")
      .in("user_id", uids);
    for (const r of tokenRows ?? []) {
      const e = uidToEmail[(r as any).user_id];
      if (!e) continue;
      (emailToTokens[e] ||= []).push({ token: (r as any).token, platform: (r as any).platform });
    }
  }
  return emailToTokens;
}

/**
 * Notify one customer: push if they have device tokens, otherwise email.
 * Returns the channel used (or "none" if both failed / unavailable).
 */
export async function pushOrEmail(opts: {
  email: string;
  tokens?: PushToken[];
  title: string;
  body: string;
  data?: Record<string, string>;
  emailSubject: string;
  emailText: string;
  emailHtml?: string;
}): Promise<"push" | "email" | "none"> {
  // Attempt push first — but only treat it as done if OneSignal actually
  // accepted a recipient. Unconfigured keys or a dead token deliver 0,
  // in which case we fall through to email so the customer is never
  // silently dropped.
  if (opts.tokens && opts.tokens.length > 0) {
    const { delivered } = await sendPushToDeviceTokens(opts.tokens, opts.title, opts.body, opts.data);
    if (delivered > 0) return "push";
  }
  try {
    await sendEmail(opts.email, opts.emailSubject, opts.emailText, undefined, opts.emailHtml);
    return "email";
  } catch (err: any) {
    // "none" means the customer was NOT reached. Never let that pass
    // silently — sendEmail already logged the Resend error; this line
    // records which notification was lost and to whom.
    console.error(
      `[notify] UNREACHED email=${opts.email} title=${JSON.stringify(opts.title)} ` +
        `push_tokens=${opts.tokens?.length ?? 0} reason=${JSON.stringify(err?.message ?? "unknown")}`
    );
    return "none";
  }
}
