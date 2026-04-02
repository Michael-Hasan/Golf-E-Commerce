type EnvironmentConfig = {
  NODE_ENV: string;
  PORT: string;
  USE_IN_MEMORY_DB: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  DB_RUN_MIGRATIONS: string;
  RATE_LIMIT_TTL_MS: string;
  RATE_LIMIT_MAX: string;
  GRAPHQL_MAX_DEPTH: string;
  GRAPHQL_MAX_COMPLEXITY: string;
  CACHE_TTL_MS: string;
  LOG_LEVEL: string;
};

export function validateEnv(
  raw: Record<string, unknown>,
): EnvironmentConfig {
  const nodeEnv = toStringValue(raw.NODE_ENV, 'development');
  const isProduction = nodeEnv === 'production';
  const fallbackJwtSecret = 'super-secret-jwt-key';

  const env = {
    NODE_ENV: nodeEnv,
    PORT: toNumberString(raw.PORT, 3000),
    USE_IN_MEMORY_DB: toBooleanString(raw.USE_IN_MEMORY_DB, true),
    JWT_SECRET: isProduction
      ? toRequiredString(raw.JWT_SECRET, 'JWT_SECRET')
      : toStringValue(raw.JWT_SECRET, fallbackJwtSecret),
    JWT_REFRESH_SECRET: isProduction
      ? toRequiredString(raw.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET')
      : toStringValue(raw.JWT_REFRESH_SECRET, `${fallbackJwtSecret}-refresh`),
    JWT_ACCESS_EXPIRES_IN: toStringValue(raw.JWT_ACCESS_EXPIRES_IN, '15m'),
    JWT_REFRESH_EXPIRES_IN: toStringValue(raw.JWT_REFRESH_EXPIRES_IN, '7d'),
    DB_HOST: toStringValue(raw.DB_HOST, 'localhost'),
    DB_PORT: toNumberString(raw.DB_PORT, 5432),
    DB_USERNAME: toStringValue(raw.DB_USERNAME, 'postgres'),
    DB_PASSWORD: toStringValue(raw.DB_PASSWORD, 'postgres'),
    DB_DATABASE: toStringValue(raw.DB_DATABASE, 'golf_ecommerce'),
    DB_RUN_MIGRATIONS: toBooleanString(raw.DB_RUN_MIGRATIONS, true),
    RATE_LIMIT_TTL_MS: toNumberString(raw.RATE_LIMIT_TTL_MS, 60000),
    RATE_LIMIT_MAX: toNumberString(raw.RATE_LIMIT_MAX, 120),
    GRAPHQL_MAX_DEPTH: toNumberString(raw.GRAPHQL_MAX_DEPTH, 8),
    GRAPHQL_MAX_COMPLEXITY: toNumberString(raw.GRAPHQL_MAX_COMPLEXITY, 150),
    CACHE_TTL_MS: toNumberString(raw.CACHE_TTL_MS, 60000),
    LOG_LEVEL: toStringValue(raw.LOG_LEVEL, 'info'),
  };

  if (!['development', 'test', 'production'].includes(env.NODE_ENV)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  if (env.USE_IN_MEMORY_DB === '0') {
    toRequiredString(raw.DB_HOST, 'DB_HOST');
    toRequiredString(raw.DB_USERNAME, 'DB_USERNAME');
    toRequiredString(raw.DB_PASSWORD, 'DB_PASSWORD');
    toRequiredString(raw.DB_DATABASE, 'DB_DATABASE');
  }

  return env;
}

function toStringValue(value: unknown, fallback: string): string {
  const normalized = String(value ?? fallback).trim();
  return normalized || fallback;
}

function toRequiredString(value: unknown, key: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return normalized;
}

function toNumberString(value: unknown, fallback: number): string {
  const normalized = Number(value ?? fallback);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error(`Expected a positive number, received: ${String(value)}`);
  }
  return String(Math.floor(normalized));
}

function toBooleanString(value: unknown, fallback: boolean): string {
  if (value === undefined || value === null || value === '') {
    return fallback ? '1' : '0';
  }
  return String(value) === '0' ? '0' : '1';
}
