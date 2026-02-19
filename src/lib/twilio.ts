import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const from = process.env.TWILIO_PHONE_NUMBER!;

export async function sendSms(to: string, body: string) {
  if (!accountSid || !authToken || !from) {
    throw new Error("Missing TWILIO_* env vars");
  }
  const client = twilio(accountSid, authToken);
  return client.messages.create({ to, from, body });
}