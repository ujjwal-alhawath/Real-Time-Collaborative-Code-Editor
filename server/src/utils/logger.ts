import pino from 'pino';
import { env, isDevelopment } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  serializers: {
    err: pino.stdSerializers.err,
    req: (req: Record<string, unknown>) => ({
      method: req['method'],
      url: req['url'],
      id: req['id'],
    }),
    res: (res: Record<string, unknown>) => ({
      statusCode: res['statusCode'],
    }),
  },
});
