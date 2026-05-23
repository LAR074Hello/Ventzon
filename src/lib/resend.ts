import { Resend } from "resend";

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

  return getResend().emails.send({
    from: "Ventzon Rewards <onboarding@resend.dev>",
    to,
    subject,
    html: htmlOverride ?? defaultHtml,
  });
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
