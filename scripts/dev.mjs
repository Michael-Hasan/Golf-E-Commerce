import { spawn } from "node:child_process";

const backendHost = process.env.BACKEND_HOST ?? "localhost";
const backendPort = process.env.PORT ?? "3000";
const defaultBackendOrigin = `http://${backendHost}:${backendPort}`;
const frontendApiUrl = process.env.VITE_API_URL ?? defaultBackendOrigin;
const graphqlProbeUrl = `${defaultBackendOrigin}/graphql`;

console.log(`[dev] backend target set to ${defaultBackendOrigin}`);
console.log(`[dev] frontend VITE_API_URL=${frontendApiUrl}`);

const children = [];

function spawnChild(proc) {
  const child = spawn(proc.command, proc.args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: false,
    env: proc.env ?? process.env,
  });

  const prefix = `${proc.color}[${proc.name}]${proc.reset} `;
  const writePrefixed = (stream, chunk) => {
    const lines = chunk.toString().split("\n");
    const trailingNewline = chunk.toString().endsWith("\n");

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (line.length > 0) {
        stream.write(`${prefix}${line}`);
      }
      if (index < lines.length - 1 || trailingNewline) {
        stream.write("\n");
      }
    }
  };

  child.stdout.on("data", (chunk) => {
    writePrefixed(process.stdout, chunk);
  });
  child.stderr.on("data", (chunk) => {
    writePrefixed(process.stderr, chunk);
  });

  child.on("exit", (code, signal) => {
    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    process.stderr.write(`${prefix}exited with ${reason}\n`);
    shutdown(child);
  });

  child.on("error", (error) => {
    process.stderr.write(`${prefix}failed to start: ${error.message}\n`);
    shutdown(child);
  });

  children.push(child);
  return child;
}

async function waitForBackendReady(url, options = {}) {
  const { timeoutMs = 15000, intervalMs = 1000, attemptTimeoutMs = 2000 } =
    options;
  const deadline = Date.now() + timeoutMs;
  const probeBody = JSON.stringify({ query: "query { __typename }" });

  while (Date.now() < deadline) {
    let timer;
    try {
      const controller = new AbortController();
      timer = setTimeout(() => controller.abort(), attemptTimeoutMs);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: probeBody,
        signal: controller.signal,
      });
      if (response.ok) {
        return;
      }
    } catch {
      // ignore; backend still booting
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Backend did not respond in time");
}

async function main() {
  spawnChild({
    name: "backend",
    color: "\u001b[36m",
    reset: "\u001b[0m",
    command: "npm",
    args: ["run", "start:dev", "--prefix", "backend"],
  });

  try {
    await waitForBackendReady(graphqlProbeUrl);
    console.log("[dev] backend ready");
  } catch (error) {
    console.warn(`[dev] backend readiness check failed: ${error.message}`);
  }

  spawnChild({
    name: "frontend",
    color: "\u001b[35m",
    reset: "\u001b[0m",
    command: "npm",
    args: ["run", "dev", "--prefix", "frontend"],
    env: {
      ...process.env,
      VITE_API_URL: frontendApiUrl,
    },
  });
}

main().catch((error) => {
  console.error("[dev] failed to start dev tooling", error);
  process.exit(1);
});

let shuttingDown = false;

function shutdown(origin) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (child !== origin && !child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
  }, 1500).unref();
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    shutdown();
    process.exit(0);
  });
}
