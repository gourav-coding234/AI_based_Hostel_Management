import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const api = spawn(process.execPath, ["scripts/api-dev.mjs"], { cwd: root, stdio: "inherit", env: process.env });
const frontend = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"], { cwd: root, stdio: "inherit", env: process.env });
let shuttingDown = false;

function stop(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  api.kill();
  frontend.kill();
  process.exitCode = code;
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
api.on("exit", (code) => { if (!shuttingDown) stop(code || 1); });
frontend.on("exit", (code) => { if (!shuttingDown) stop(code || 1); });
