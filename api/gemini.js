// Vercel serverless function: keeps the Gemini key on the server.
// Set GEMINI_API_KEY (no VITE_ prefix) in Vercel -> Settings -> Environment Variables.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(501).json({
      error: { message: "GEMINI_API_KEY is missing on the server. Add it in Vercel environment variables and redeploy." },
    });
  }

  const { model, contents, generationConfig, systemInstruction } = req.body || {};
  if (typeof model !== "string" || !/^gemini-[A-Za-z0-9._-]+$/.test(model)) {
    return res.status(400).json({ error: { message: "Invalid model" } });
  }
  if (!Array.isArray(contents) || contents.length === 0) {
    return res.status(400).json({ error: { message: "contents is required" } });
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        // Forward only the fields we expect.
        body: JSON.stringify({ contents, generationConfig, systemInstruction }),
      },
    );
    const text = await upstream.text();
    res.status(upstream.status).setHeader("Content-Type", "application/json").send(text);
  } catch {
    res.status(502).json({ error: { message: "Upstream request failed" } });
  }
}
