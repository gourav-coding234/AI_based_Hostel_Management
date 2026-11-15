/** Read a JSON API response without leaking a browser SyntaxError when a
 * hosting platform returns an HTML error page instead of the API payload. */
export async function readJsonResponse(response, fallback = "The server returned an unexpected response.") {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const contentType = response.headers.get("content-type") || "";
    const looksLikeHtml = contentType.includes("text/html") || /^\s*<!doctype html|^\s*<html/i.test(text);
    return {
      message: looksLikeHtml
        ? `The server returned an error page (${response.status}). Please try again; if it continues, contact the administrator.`
        : fallback,
    };
  }
}
