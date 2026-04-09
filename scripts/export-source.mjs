import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const rawArgs = process.argv.slice(2);
const outputArg = rawArgs.find((arg) => arg.startsWith("--output="));
const fallbackArg = rawArgs[0];
const outputPath = resolve(
  process.cwd(),
  outputArg ? outputArg.split("=")[1] : fallbackArg ?? "../golf-ecommerce-source.zip",
);

try {
  execFileSync(
    "git",
    ["archive", "--format=zip", "--prefix=golf-ecommerce/", "-o", outputPath, "HEAD"],
    { stdio: "inherit" },
  );
  console.log(`Clean source package ready: ${outputPath}`);
} catch (error) {
  console.error("Failed to create archive", error);
  process.exit(1);
}
