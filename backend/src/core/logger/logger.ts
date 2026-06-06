/**
 * Structured application logger (pino).
 * In development it pretty-prints; in production it emits JSON for log
 * aggregation (Azure Monitor / Log Analytics).
 */
import pino from 'pino';
import { env, isProd } from '@/core/config/env';

// pino `transport` spawns a worker thread via thread-stream, which Next.js
// kills during hot-reload, causing "the worker has exited" crashes on every
// subsequent log call. Using pino-pretty as a synchronous stream avoids the
// worker thread entirely.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const stream = isProd ? undefined : require('pino-pretty')({ colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,app', sync: true });

export const logger = pino(
  {
    level: env.LOG_LEVEL,
    base: { app: env.APP_NAME },
    redact: {
      paths: [
        'req.headers.authorization',
        'authorization',
        'password',
        'codeHash',
        'tokenHash',
        'refreshToken',
        'accessToken',
        'otp',
      ],
      censor: '[redacted]',
    },
  },
  stream,
);

export type Logger = typeof logger;
