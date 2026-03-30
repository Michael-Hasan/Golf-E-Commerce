import { spawn } from "node:child_process";

const processes = [
  {
    name: "backend",
    color: "\u001b[36m",
    reset: "\u001b[0m",
    command: "npm",
    args: ["run", "start:dev", "--prefix", "backend"],
  },
  {
    name: "frontend",
    color: "\u001b[35m",
    reset: "\u001b[0m",
    command: "npm",
    args: ["run", "dev", "--prefix", "frontend"],
  },
];

const children = processes.map((proc) => {
  const child = spawn(proc.command, proc.args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: false,
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

  return child;
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
