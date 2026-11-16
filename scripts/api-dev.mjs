import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const apiRoot = path.resolve(root, "api");
const port = Number(process.env.API_PORT || 3001);

for (const file of [".env", ".env.local"]) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) continue;
  for (const line of fs.readFileSync(fullPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] == null) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function resolveHandler(pathname) {
  const relative = decodeURIComponent(pathname).replace(/^\/api\/?/, "");
  if (!relative || relative.includes("..") || relative.includes("\\")) return null;
  const candidate = path.resolve(apiRoot, `${relative}.js`);
  return candidate.startsWith(`${apiRoot}${path.sep}`) && fs.existsSync(candidate) ? candidate : null;
}

const server = http.createServer(async (request, response) => {
  if (!request.url?.startsWith("/api/")) return sendJson(response, 404, { message: "API route not found." });
  const handlerPath = resolveHandler(new URL(request.url, "http://localhost").pathname);
  if (!handlerPath) return sendJson(response, 404, { message: "API route not found." });

  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 1_000_000) return sendJson(response, 413, { message: "Request body is too large." });
  }
  let body = {};
  if (raw) {
    try { body = JSON.parse(raw); }
    catch { return sendJson(response, 400, { message: "Request body must be valid JSON." }); }
  }

  try {
    const module = await import(pathToFileURL(handlerPath).href);
    const apiResponse = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(value) {
        console.log(`${request.method} ${request.url} -> ${this.statusCode}`);
        sendJson(response, this.statusCode, value);
        return this;
      },
    };
    await module.default({ method: request.method, headers: request.headers, body, url: request.url }, apiResponse);
    if (!response.writableEnded) sendJson(response, apiResponse.statusCode, { message: "API handler did not send a response." });
  } catch (error) {
    console.error(`API dev handler failed (${request.method} ${request.url}):`, error);
    sendJson(response, 500, { message: "The API handler failed. Check the local server log." });
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`\nPort ${port} is already in use - an earlier "npm run dev" is probably still running.`);
    console.error(`Close that terminal, or free the port on Windows with:`);
    console.error(`  for /f "tokens=5" %p in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /F /PID %p`);
    console.error(`Or use another port:  set API_PORT=3002 && npm run dev\n`);
    process.exit(1);
  }
  throw error;
});
server.listen(port, "127.0.0.1", () => console.log(`Local API handlers listening on http://127.0.0.1:${port}`));
