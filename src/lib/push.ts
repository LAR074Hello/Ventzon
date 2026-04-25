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

export async function sendPushToDeviceTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;
  if (!appId || !apiKey || tokens.length === 0) return;

  await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_ios_tokens: tokens,
      headings: { en: title },
      contents: { en: body },
      data: data ?? {},
    }),
  });
}
