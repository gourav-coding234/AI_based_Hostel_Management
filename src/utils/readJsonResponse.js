/** Read a JSON API response without leaking a browser SyntaxError when a
 * hosting platform returns an HTML error page instead of the API payload. */
export async function readJsonResponse(response, fallback = "The server returned an unexpected response.") {
  const text = await response.text();
  if (!text) {
    return response.ok ? {} : { message: `The server returned HTTP ${response.status} with an empty response.` };
  }
  try {
    return JSON.parse(text);
  } catch {
    const contentType = response.headers.get("content-type") || "";
    const looksLikeHtml = contentType.includes("text/html") || /^\s*<!doctype html|^\s*<html/i.test(text);
    const safeBody = text.replace(/\s+/g, " ").trim().slice(0, 180);
    return {
      message: looksLikeHtml
        ? `The server returned an HTML error page (HTTP ${response.status}). The API route may not be deployed or is failing before its handler runs.`
        : `${fallback} HTTP ${response.status}${safeBody ? `: ${safeBody}` : ""}`,
    };
  }
}
