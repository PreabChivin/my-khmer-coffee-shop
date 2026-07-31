#!/usr/bin/env node
/**
 * 🚀 One-command local run of the full hybrid stack: Next.js dev server +
 * the Python FastAPI sidecar (backend-py), together, with prefixed output.
 *
 *   npm run dev:all
 *
 * Cross-platform and dependency-free (no `concurrently`): it resolves the
 * backend-py virtualenv's Python itself (Windows `Scripts\` vs POSIX `bin/`)
 * and launches uvicorn via `python -m uvicorn`. If the venv isn't set up yet
 * it prints the exact bootstrap commands and still starts Next.js alone, so
 * the web app is never blocked by the optional sidecar.
 *
 * With both up, set these in .env.local so the bridge talks to the sidecar
 * and the dashboard's Hybrid AI card flips to ONLINE:
 *   PYTHON_AI_SERVICE_URL=http://localhost:8000
 *   PYTHON_AI_SERVICE_SECRET=<same as backend-py/.env API_SECRET>
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import process from "node:process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const venvPython = isWin
  ? join(root, "backend-py", ".venv", "Scripts", "python.exe")
  : join(root, "backend-py", ".venv", "bin", "python");

const children = [];
let shuttingDown = false;

function color(prefix, code) {
  return `\x1b[${code}m${prefix}\x1b[0m`;
}

function pipe(child, label) {
  const tag = `[${label}] `;
  const relay = (stream, out) => {
    stream.setEncoding("utf8");
    let buf = "";
    stream.on("data", (chunk) => {
      buf += chunk;
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) out.write(tag + line + "\n");
    });
    stream.on("end", () => {
      if (buf) out.write(tag + buf + "\n");
    });
  };
  relay(child.stdout, process.stdout);
  relay(child.stderr, process.stderr);
}

function start(label, command, args, opts = {}) {
  const child = spawn(command, args, { cwd: root, shell: isWin, ...opts });
  children.push(child);
  pipe(child, label);
  child.on("exit", (code) => {
    if (!shuttingDown) {
      process.stdout.write(`${color(`[${label}]`, 90)} exited (code ${code}). Shutting down the rest…\n`);
      shutdown();
    }
  });
  return child;
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    try {
      child.kill(isWin ? undefined : "SIGTERM");
    } catch {
      /* already gone */
    }
  }
  setTimeout(() => process.exit(0), 500);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Next.js — always.
start("next", isWin ? "npx.cmd" : "npx", ["next", "dev"], {
  env: { ...process.env, FORCE_COLOR: "1" },
});

// Python sidecar — only if the venv exists.
if (existsSync(venvPython)) {
  start(
    color("uvicorn", 36),
    venvPython,
    ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
    { cwd: join(root, "backend-py") }
  );
} else {
  process.stdout.write(
    color("[uvicorn]", 33) +
      " backend-py venv not found — starting Next.js only.\n" +
      "          To enable the Python sidecar, run once:\n" +
      "            cd backend-py\n" +
      (isWin
        ? "            python -m venv .venv; .venv\\Scripts\\pip install -r requirements.txt\n"
        : "            python3 -m venv .venv && .venv/bin/pip install -r requirements.txt\n") +
      "            (then copy .env.example to .env and fill DATABASE_URL + API_SECRET)\n"
  );
}
