// Client-side push registration. Shared by the session-load path (register
// only if already granted), the first-reward-earned prompt, and the settings
// toggle. The registration listener is always attached BEFORE register() so
// the token callback cannot be dropped, and registrationError is surfaced
// instead of swallowed.

export type PushPermissionState = "granted" | "denied" | "prompt" | "prompt-with-rationale" | "unknown";

let registered = false;

export async function checkPushPermission(): Promise<PushPermissionState> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return "unknown";
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.checkPermissions();
    return perm.receive;
  } catch {
    return "unknown";
  }
}

/**
 * Attaches listeners and registers for push. Idempotent per session so the
 * settings toggle and the reward prompt can both call it safely.
 */
export async function registerDevicePush(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return false;
    if (registered) return true;
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const platform = Capacitor.getPlatform(); // "ios" | "android"

    // Listener first - register() can fire the callback immediately in some
    // Capacitor versions, so attaching after would drop the token.
    PushNotifications.addListener("registration", ({ value: token }) => {
      fetch("/api/customer/device-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform }),
      }).catch(() => {});
    });
    PushNotifications.addListener("registrationError", (err: unknown) => {
      // Failures were invisible before. Log without leaking the raw error
      // into the UI. The simulator always hits this - APNs needs a real
      // device. POST-BETA: surface in settings if it keeps failing.
      console.error("[push] registration failed", err);
    });

    await PushNotifications.register();
    registered = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Requests permission and registers on grant. Safe to call from a moment
 * where notifications obviously matter (first reward earned, settings toggle).
 */
export async function requestPushPermission(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return false;
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const res = await PushNotifications.requestPermissions();
    if (res.receive !== "granted") return false;
    return registerDevicePush();
  } catch {
    return false;
  }
}
