// SMS via Twilio has been removed. Ventzon uses push notifications (OneSignal) instead.
export async function sendSms(_to: string, _body: string): Promise<void> {
  throw new Error("SMS is not supported. Use push notifications instead.");
}
