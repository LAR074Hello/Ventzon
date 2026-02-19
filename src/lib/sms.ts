import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const FROM = process.env.TWILIO_PHONE_NUMBER!;

/** Replace {{shop_name}} and {{deal_title}} in a template string. */
export function renderTemplate(
  template: string,
  vars: { shop_name: string; deal_title: string }
): string {
  return template
    .replaceAll("{{shop_name}}", vars.shop_name)
    .replaceAll("{{deal_title}}", vars.deal_title);
}

/** Send a transactional SMS. Returns the message SID on success. */
export async function sendSms(to: string, body: string): Promise<string> {
  const msg = await client.messages.create({ to, from: FROM, body });
  return msg.sid;
}
