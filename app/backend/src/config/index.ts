type NodeEnv = 'development' | 'test' | 'production';

function parseInteger(
  value: string | undefined,
  fallback: number,
  name: string,
  min = 1,
  max = Number.MAX_SAFE_INTEGER
): number {
  const parsed = Number(value ?? fallback);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`Invalid ${name} value: ${value}`);
  }

  return parsed;
}

function parseNodeEnv(value: string | undefined): NodeEnv {
  const nodeEnv = value ?? 'development';

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV value: ${value}`);
  }

  return nodeEnv as NodeEnv;
}

function parseUrl(value: string | undefined, fallback: string): string {
  const url = value ?? fallback;

  try {
    return new URL(url).toString().replace(/\/$/, '');
  } catch {
    throw new Error(`Invalid FRONTEND_URL value: ${value}`);
  }
}

const nodeEnv = parseNodeEnv(process.env.NODE_ENV);

export const config = {
  port: parseInteger(process.env.PORT, 3001, 'PORT', 1, 65535),
  nodeEnv,
  frontendUrl: parseUrl(process.env.FRONTEND_URL, 'http://localhost:5173'),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '100kb',
  rateLimitWindowMs: parseInteger(process.env.RATE_LIMIT_WINDOW_MS, 60_000, 'RATE_LIMIT_WINDOW_MS'),
  rateLimitMax: parseInteger(process.env.RATE_LIMIT_MAX, 120, 'RATE_LIMIT_MAX'),
  isDevelopment: nodeEnv !== 'production',
};
