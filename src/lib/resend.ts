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
  unsubscribeUrl?: string
) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY env var");
  }

  const safeBody = escapeHtml(body).replace(/\n/g, "<br/>");

  const unsubscribeFooter = unsubscribeUrl
    ? `<p style="font-size:12px;color:#999;margin:8px 0 0">
        <a href="${unsubscribeUrl}" style="color:#999;text-decoration:underline">Unsubscribe</a>
        &nbsp;from this loyalty program's emails.
      </p>`
    : "";

  return getResend().emails.send({
    from: "Ventzon Rewards <rewards@ventzon.com>",
    to,
    subject,
    html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#222">
      <p style="font-size:16px;line-height:1.6;margin:0">${safeBody}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="font-size:12px;color:#999;margin:0">Sent by Ventzon Rewards</p>
      ${unsubscribeFooter}
    </div>`,
  });
}
