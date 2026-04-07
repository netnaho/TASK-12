import pino from 'pino';
import { config } from './index';

const redactPaths = [
  'password',
  'passwordHash',
  'token',
  'authorization',
  'req.headers.authorization',
  'req.headers.cookie',
];

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  ...(config.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
});
