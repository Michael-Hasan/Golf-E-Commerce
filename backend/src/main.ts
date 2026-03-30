import { existsSync } from "fs";
import { resolve } from "path";
import { config as loadEnv } from "dotenv";
import "reflect-metadata";

// Load backend/.env even when npm is started from the monorepo root (cwd ≠ backend).
const backendEnv = resolve(__dirname, "..", ".env");
const cwdEnv = resolve(process.cwd(), ".env");
if (existsSync(backendEnv)) {
  loadEnv({ path: backendEnv });
}
if (existsSync(cwdEnv) && cwdEnv !== backendEnv) {
  loadEnv({ path: cwdEnv });
}
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  // eslint-disable-next-line no-console
  console.log("Bootstrapping backend...");
  const app = await NestFactory.create(AppModule);

  const port = parseInt(process.env.PORT ?? "3000", 10) || 3000;
  const allowOrigin = new Set<string>([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`,
  ]);
  for (const part of process.env.CORS_ORIGIN?.split(",") ?? []) {
    const o = part.trim();
    if (o) allowOrigin.add(o);
  }
  app.enableCors({
    origin: (reqOrigin, callback) => {
      if (!reqOrigin || allowOrigin.has(reqOrigin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.listen(port);
  const useDb = process.env.USE_IN_MEMORY_DB === "0";
  // eslint-disable-next-line no-console
  console.log(
    `🚀 GraphQL server is running on http://localhost:${port}/graphql`,
  );
  // eslint-disable-next-line no-console
  console.log(
    useDb
      ? "📦 Using PostgreSQL"
      : "📦 Using in-memory storage (set USE_IN_MEMORY_DB=0 for PostgreSQL)",
  );
  console.log("USE_IN_MEMORY_DB =", process.env.USE_IN_MEMORY_DB);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Backend failed to start:", error);
  process.exit(1);
});
