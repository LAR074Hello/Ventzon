// Sends push notifications via OneSignal REST API.
// Set ONESIGNAL_APP_ID and ONESIGNAL_API_KEY in environment variables.
// Docs: https://documentation.onesignal.com/reference/create-notification

export async function sendPushToUser(
  userId: string, // Supabase auth user id stored as OneSignal external_id
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;
  if (!appId || !apiKey) return; // silently skip if not configured

  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_aliases: { external_id: [userId] },
      target_channel: "push",
      headings: { en: title },
      contents: { en: body },
      data: data ?? {},
    }),
  });
}

export type PushToken = { token: string; platform?: string | null };

/**
 * Send to a set of platform-tagged device tokens. Returns how many
 * recipients OneSignal actually accepted, so callers can fall back to
 * email when push did NOT deliver (unconfigured keys, stale/dead tokens,
 * a request OneSignal rejected). Never throws.
 */
export async function sendPushToDeviceTokens(
  tokens: Array<string | PushToken>,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ delivered: number }> {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;
  if (!appId || !apiKey || tokens.length === 0) return { delivered: 0 };

  // Partition by platform so iOS APNs tokens and Android FCM tokens go
  // to the correct OneSignal field (default legacy tokens to iOS).
  const normalized: PushToken[] = tokens.map((t) =>
    typeof t === "string" ? { token: t, platform: "ios" } : t
  );
  const iosTokens = normalized.filter((t) => (t.platform ?? "ios") === "ios").map((t) => t.token);
  const androidTokens = normalized.filter((t) => t.platform === "android").map((t) => t.token);

  const payload: Record<string, unknown> = {
    app_id: appId,
    headings: { en: title },
    contents: { en: body },
    data: data ?? {},
  };
  if (iosTokens.length) payload.include_ios_tokens = iosTokens;
  if (androidTokens.length) payload.include_android_reg_ids = androidTokens;
  if (!iosTokens.length && !androidTokens.length) return { delivered: 0 };

  try {
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    const json: any = await res.json().catch(() => ({}));
    // OneSignal returns { recipients, id, errors? }. A 200 with 0
    // recipients (or an errors array) means nothing was delivered.
    if (!res.ok) return { delivered: 0 };
    return { delivered: Number(json?.recipients ?? 0) };
  } catch {
    return { delivered: 0 };
  }
}
