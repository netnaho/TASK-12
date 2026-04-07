import pino, { type Logger } from 'pino';
import { env } from '../config/env';

const REDACTED_PATHS = [
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'tokenHash',
  'token_hash',
  'secret',
  'authorization',
  'cookie',
  'employeeId',
  'employee_id',
  'employeeIdEncrypted',
  'req.headers.authorization',
  'req.headers.cookie',
  'body.password',
  'body.currentPassword',
  'body.newPassword',
];

const buildTransport = () => {
  if (env.NODE_ENV === 'development') {
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    };
  }
  return undefined;
};

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: REDACTED_PATHS,
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  transport: buildTransport(),
  base: {
    env: env.NODE_ENV,
  },
});
