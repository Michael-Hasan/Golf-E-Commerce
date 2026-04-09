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
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { AppLogger } from "./logging/logger.service";

async function bootstrap() {
  const bootstrapLogger = new AppLogger().withContext("Bootstrap");
  bootstrapLogger.log("Bootstrapping backend");
  const app = await NestFactory.create(AppModule);
  const logger = app.get(AppLogger).withContext("Bootstrap");
  app.useLogger(logger);
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });
  app.enableShutdownHooks();

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
  try {
    // Helmet v8 is ESM-only; use dynamic import to support CommonJS builds.
    const helmetModule = await import('helmet');
    const helmet = helmetModule.default;
    app.use(helmet());
  } catch {
    logger.warn('Helmet is not available; HTTP security headers are disabled');
  }
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  await app.listen(port);
  const useDb = process.env.USE_IN_MEMORY_DB === "0";
  logger.log(
    `GraphQL server is running on http://localhost:${port}/graphql`,
  );
  logger.log(
    useDb
      ? "Using PostgreSQL"
      : "Using in-memory storage (set USE_IN_MEMORY_DB=0 for PostgreSQL)",
  );
  logger.log("Runtime storage mode", {
    useInMemoryDb: process.env.USE_IN_MEMORY_DB !== "0",
  });
}

bootstrap().catch((error) => {
  const bootstrapLogger = new AppLogger().withContext("Bootstrap");
  bootstrapLogger.error("Backend failed to start", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
