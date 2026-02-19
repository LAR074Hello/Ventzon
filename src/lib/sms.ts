import twilio from "twilio";

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
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
  const from = process.env.TWILIO_PHONE_NUMBER!;
  const msg = await client.messages.create({ to, from, body });
  return msg.sid;
}
