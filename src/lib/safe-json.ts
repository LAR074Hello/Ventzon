/**
 * Parse a fetch Response body as JSON, tolerantly.
 *
 * Safari/WebKit reports a non-JSON body — an HTML error page, an SSO/redirect
 * page, an empty body — as:
 *
 *   SyntaxError: The string did not match the expected pattern.
 *
 * That is a raw DOMException that tells the user nothing and that most call
 * sites never catch (it is not a rejected Promise of res.json(); it IS the
 * rejection, with a message unique to WebKit). safeJson converts that failure
 * into a caught, logged error carrying the real response details, then throws
 * a clear message the UI can render.
 *
 * Usage (replace `await res.json()`):
 *   const data = await safeJson(res);
 *
 * Existing `.catch(() => null)` / `.catch(() => ({}))` wrappers still work:
 *   const data = await safeJson(res).catch(() => null);
 */
export async function safeJson<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  const contentType = res.headers.get("content-type");
  if (!text.trim()) {
    console.error("[safeJson] empty response", res.status, contentType);
    throw new Error("The server returned an unexpected response. Please try again.");
  }
  try {
    return JSON.parse(text) as T;
  } catch (parseErr) {
    // This is the Safari failure ("The string did not match the expected
    // pattern") — log everything so the real culprit (status + body) is
    // visible in the device console instead of the WebKit message alone.
    console.error(
      "[safeJson] non-JSON response",
      res.status,
      contentType,
      JSON.stringify(text.slice(0, 200)),
      parseErr
    );
    throw new Error("The server returned an unexpected response. Please try again.");
  }
}
