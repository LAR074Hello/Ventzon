import { Resend } from "resend";

/**
 * Sender address. Until a domain is verified in Resend this is the shared
 * sandbox sender, which can ONLY deliver to the Resend account owner —
 * every other recipient gets a 403. Swap to a verified ventzon.com
 * address once DNS is confirmed.
 */
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Ventzon Rewards <onboarding@resend.dev>";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  unsubscribeUrl?: string,
  htmlOverride?: string
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY env var");
  }

  const safeBody = escapeHtml(body).replace(/\n/g, "<br/>");

  const unsubscribeFooter = unsubscribeUrl
    ? `<p style="font-size:12px;color:#777;margin:8px 0 0">
        <a href="${unsubscribeUrl}" style="color:#777;text-decoration:underline">Unsubscribe</a>
        &nbsp;from this loyalty program's emails.
      </p>`
    : "";

  const defaultHtml = `
<div style="background:#000;padding:0;margin:0">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#ededed">
    <div style="padding:32px 32px 0">
      <p style="font-size:11px;letter-spacing:0.4em;color:#555;margin:0">VENTZON REWARDS</p>
    </div>
    <div style="padding:28px 32px 32px">
      <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0">${safeBody}</p>
    </div>
    <div style="border-top:1px solid #1a1a1a;padding:20px 32px">
      <p style="font-size:11px;color:#444;margin:0">Sent by Ventzon Rewards</p>
      ${unsubscribeFooter}
    </div>
  </div>
</div>`;

  // NOTE: the Resend SDK does NOT throw on API errors — it resolves with
  // { data, error }. Returning that object directly meant every caller's
  // try/catch was dead code and failures (e.g. the 403 you get when
  // sending from the unverified sandbox domain to a non-owner address)
  // looked identical to success. Inspect the payload and throw.
  const result = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html: htmlOverride ?? defaultHtml,
  });

  if (result?.error) {
    const err = result.error as { name?: string; message?: string; statusCode?: number };
    // Structured single-line log so it is greppable in Vercel logs.
    console.error(
      `[email] SEND FAILED to=${to} subject=${JSON.stringify(subject)} ` +
        `name=${err.name ?? "unknown"} status=${err.statusCode ?? "?"} msg=${JSON.stringify(err.message ?? "")}`
    );
    const e = new Error(`Resend send failed: ${err.name ?? "error"} — ${err.message ?? "no message"}`);
    (e as any).resendError = err;
    throw e;
  }

  return result;
}

/** Build a rich HTML "almost there" email (1 stamp away) */
export function buildAlmostThereEmail(opts: {
  shopName: string;
  dealTitle: string;
  goal: number;
}): string {
  const { shopName, dealTitle, goal } = opts;
  const safeName = escapeHtml(shopName);
  const safeDeal = escapeHtml(dealTitle);
  const filled = goal - 1;

  const dots = Array.from({ length: Math.min(goal, 12) })
    .map((_, i) =>
      i < filled
        ? `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#ededed;margin:0 3px"></span>`
        : `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;border:1px solid #444;background:transparent;margin:0 3px"></span>`
    )
    .join("");

  return `
<div style="background:#000;padding:0;margin:0">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#ededed">
    <div style="padding:32px 32px 0">
      <p style="font-size:11px;letter-spacing:0.4em;color:#555;margin:0">VENTZON REWARDS</p>
    </div>
    <div style="padding:36px 32px 28px;text-align:center">
      <h1 style="font-size:26px;font-weight:200;letter-spacing:-0.01em;color:#fff;margin:0 0 8px">Just one more visit.</h1>
      <p style="font-size:13px;font-weight:300;letter-spacing:0.05em;color:#888;margin:0">${safeName.toUpperCase()}</p>
    </div>
    <div style="padding:0 32px 28px;text-align:center">
      ${dots}
      <p style="font-size:11px;letter-spacing:0.15em;color:#555;margin:12px 0 0">${filled}/${goal} STAMPS · 1 TO GO</p>
    </div>
    <div style="margin:0 32px 28px;border:1px solid #1a1a1a;border-radius:12px;padding:20px 24px;text-align:center">
      <p style="font-size:11px;letter-spacing:0.2em;color:#555;margin:0 0 8px">YOUR UPCOMING REWARD</p>
      <p style="font-size:18px;font-weight:300;color:#ededed;margin:0">${safeDeal}</p>
    </div>
    <div style="margin:0 32px 36px;background:#1c1400;border:1px solid #3d2e00;border-radius:12px;padding:18px 24px;text-align:center">
      <p style="font-size:12px;font-weight:300;color:#fbbf24;margin:0">Come back one more time to claim your reward at ${safeName}!</p>
    </div>
    <div style="border-top:1px solid #1a1a1a;padding:20px 32px">
      <p style="font-size:11px;color:#444;margin:0">Sent by Ventzon Rewards · <a href="https://www.ventzon.com" style="color:#444;text-decoration:none">ventzon.com</a></p>
    </div>
  </div>
</div>`;
}

/** Build a win-back email for lapsed customers */
export function buildWinBackEmail(opts: {
  shopName: string;
  dealTitle: string;
  goal: number;
  daysSince: number;
}): string {
  const { shopName, dealTitle, goal, daysSince } = opts;
  const safeName = escapeHtml(shopName);
  const safeDeal = escapeHtml(dealTitle);

  return `
<div style="background:#000;padding:0;margin:0">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#ededed">
    <div style="padding:32px 32px 0">
      <p style="font-size:11px;letter-spacing:0.4em;color:#555;margin:0">VENTZON REWARDS</p>
    </div>
    <div style="padding:36px 32px 28px;text-align:center">
      <h1 style="font-size:26px;font-weight:200;letter-spacing:-0.01em;color:#fff;margin:0 0 8px">We miss you.</h1>
      <p style="font-size:13px;font-weight:300;letter-spacing:0.05em;color:#888;margin:0">${safeName.toUpperCase()}</p>
    </div>
    <div style="margin:0 32px 28px;border:1px solid #1a1a1a;border-radius:12px;padding:20px 24px;text-align:center">
      <p style="font-size:11px;letter-spacing:0.2em;color:#555;margin:0 0 8px">YOUR REWARD IS WAITING</p>
      <p style="font-size:18px;font-weight:300;color:#ededed;margin:0 0 6px">${safeDeal}</p>
      <p style="font-size:12px;font-weight:300;color:#666;margin:0">after ${goal} visits</p>
    </div>
    <div style="margin:0 32px 36px;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:12px;padding:18px 24px;text-align:center">
      <p style="font-size:13px;font-weight:300;color:#999;margin:0">It's been ${daysSince} days since your last visit. Stop by and pick up where you left off.</p>
    </div>
    <div style="border-top:1px solid #1a1a1a;padding:20px 32px">
      <p style="font-size:11px;color:#444;margin:0">Sent by Ventzon Rewards · <a href="https://www.ventzon.com" style="color:#444;text-decoration:none">ventzon.com</a></p>
    </div>
  </div>
</div>`;
}

/** Build a rich HTML reward email */
export function buildRewardEmail(opts: {
  shopName: string;
  dealTitle: string;
  goal: number;
}): string {
  const { shopName, dealTitle, goal } = opts;
  const safeName = escapeHtml(shopName);
  const safeDeal = escapeHtml(dealTitle);

  // Stamp dots — all filled
  const dots = Array.from({ length: Math.min(goal, 12) })
    .map(
      () =>
        `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:#ededed;margin:0 3px"></span>`
    )
    .join("");

  return `
<div style="background:#000;padding:0;margin:0">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#ededed">

    <!-- Header -->
    <div style="padding:32px 32px 0">
      <p style="font-size:11px;letter-spacing:0.4em;color:#555;margin:0">VENTZON REWARDS</p>
    </div>

    <!-- Hero -->
    <div style="padding:36px 32px 28px;text-align:center">
      <h1 style="font-size:26px;font-weight:200;letter-spacing:-0.01em;color:#fff;margin:0 0 8px">You earned a reward.</h1>
      <p style="font-size:13px;font-weight:300;letter-spacing:0.05em;color:#888;margin:0">${safeName.toUpperCase()}</p>
    </div>

    <!-- Stamps -->
    <div style="padding:0 32px 28px;text-align:center">
      ${dots}
      <p style="font-size:11px;letter-spacing:0.15em;color:#555;margin:12px 0 0">${goal}/${goal} STAMPS COMPLETE</p>
    </div>

    <!-- Deal -->
    <div style="margin:0 32px 28px;border:1px solid #1a1a1a;border-radius:12px;padding:20px 24px;text-align:center">
      <p style="font-size:11px;letter-spacing:0.2em;color:#555;margin:0 0 8px">YOUR REWARD</p>
      <p style="font-size:18px;font-weight:300;color:#ededed;margin:0">${safeDeal}</p>
    </div>

    <!-- CTA -->
    <div style="margin:0 32px 36px;background:#052e16;border:1px solid #14532d;border-radius:12px;padding:18px 24px;text-align:center">
      <p style="font-size:11px;letter-spacing:0.2em;color:#86efac;margin:0 0 4px">SHOW THIS TO THE CASHIER</p>
      <p style="font-size:12px;font-weight:300;color:#4ade80;margin:0">to redeem your reward at ${safeName}</p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #1a1a1a;padding:20px 32px">
      <p style="font-size:11px;color:#444;margin:0">Sent by Ventzon Rewards · <a href="https://www.ventzon.com" style="color:#444;text-decoration:none">ventzon.com</a></p>
    </div>
  </div>
</div>`;
}

/** Build a rich HTML birthday-reward email */
export function buildBirthdayEmail(opts: {
  shopName: string;
  rewardTitle: string;
  message?: string;
  expiresDays?: number | null;
}): string {
  const { shopName, rewardTitle, message, expiresDays } = opts;
  const safeName = escapeHtml(shopName);
  const safeReward = escapeHtml(rewardTitle);
  const safeMessage = message ? escapeHtml(message).replace(/\n/g, "<br/>") : "";

  const expiryLine =
    expiresDays && expiresDays > 0
      ? `<p style="font-size:12px;font-weight:300;color:#4ade80;margin:6px 0 0">Valid for ${expiresDays} day${expiresDays === 1 ? "" : "s"}</p>`
      : "";

  return `
<div style="background:#000;padding:0;margin:0">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#ededed">

    <div style="padding:32px 32px 0">
      <p style="font-size:11px;letter-spacing:0.4em;color:#555;margin:0">VENTZON REWARDS</p>
    </div>

    <div style="padding:36px 32px 24px;text-align:center">
      <div style="font-size:34px;line-height:1;margin:0 0 14px">🎂</div>
      <h1 style="font-size:26px;font-weight:200;letter-spacing:-0.01em;color:#fff;margin:0 0 8px">Happy birthday!</h1>
      <p style="font-size:13px;font-weight:300;letter-spacing:0.05em;color:#888;margin:0">A gift from ${safeName.toUpperCase()}</p>
    </div>

    ${
      safeMessage
        ? `<div style="padding:0 32px 24px;text-align:center"><p style="font-size:15px;line-height:1.7;color:#ccc;margin:0">${safeMessage}</p></div>`
        : ""
    }

    <div style="margin:0 32px 24px;border:1px solid #1a1a1a;border-radius:12px;padding:20px 24px;text-align:center">
      <p style="font-size:11px;letter-spacing:0.2em;color:#555;margin:0 0 8px">YOUR BIRTHDAY REWARD</p>
      <p style="font-size:18px;font-weight:300;color:#ededed;margin:0">${safeReward}</p>
    </div>

    <div style="margin:0 32px 36px;background:#052e16;border:1px solid #14532d;border-radius:12px;padding:18px 24px;text-align:center">
      <p style="font-size:11px;letter-spacing:0.2em;color:#86efac;margin:0 0 4px">SHOW THIS TO THE CASHIER</p>
      <p style="font-size:12px;font-weight:300;color:#4ade80;margin:0">to redeem at ${safeName}</p>
      ${expiryLine}
    </div>

    <div style="border-top:1px solid #1a1a1a;padding:20px 32px">
      <p style="font-size:11px;color:#444;margin:0">Sent by Ventzon Rewards · <a href="https://www.ventzon.com" style="color:#444;text-decoration:none">ventzon.com</a></p>
    </div>
  </div>
</div>`;
}

/** Build a rich HTML occasion/holiday announcement email */
export function buildOccasionEmail(opts: {
  shopName: string;
  title: string;
  message?: string;
}): string {
  const { shopName, title, message } = opts;
  const safeName = escapeHtml(shopName);
  const safeTitle = escapeHtml(title);
  const safeMessage = message ? escapeHtml(message).replace(/\n/g, "<br/>") : "";

  return `
<div style="background:#000;padding:0;margin:0">
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;background:#000;color:#ededed">

    <div style="padding:32px 32px 0">
      <p style="font-size:11px;letter-spacing:0.4em;color:#555;margin:0">${safeName.toUpperCase()}</p>
    </div>

    <div style="padding:36px 32px 24px;text-align:center">
      <h1 style="font-size:24px;font-weight:200;letter-spacing:-0.01em;color:#fff;margin:0">${safeTitle}</h1>
    </div>

    ${
      safeMessage
        ? `<div style="padding:0 32px 24px;text-align:center"><p style="font-size:15px;line-height:1.7;color:#ccc;margin:0">${safeMessage}</p></div>`
        : ""
    }

    <div style="margin:0 32px 36px;background:#052e16;border:1px solid #14532d;border-radius:12px;padding:18px 24px;text-align:center">
      <p style="font-size:11px;letter-spacing:0.2em;color:#86efac;margin:0 0 4px">SHOW THIS AT THE REGISTER</p>
      <p style="font-size:12px;font-weight:300;color:#4ade80;margin:0">at ${safeName}</p>
    </div>

    <div style="border-top:1px solid #1a1a1a;padding:20px 32px">
      <p style="font-size:11px;color:#444;margin:0">Sent by Ventzon Rewards · <a href="https://www.ventzon.com" style="color:#444;text-decoration:none">ventzon.com</a></p>
    </div>
  </div>
</div>`;
}
