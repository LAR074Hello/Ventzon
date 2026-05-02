// SMS via Twilio has been removed. This endpoint is no longer active.
export async function POST() {
  return new Response("<Response/>", {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
