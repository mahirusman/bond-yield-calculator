import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from '../config';

export const logger = pino({
  enabled: config.nodeEnv !== 'test',
  level: process.env.LOG_LEVEL || (config.isDevelopment ? 'debug' : 'info'),
  redact: ['req.headers.authorization', 'req.headers.cookie'],
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => String(req.headers['x-request-id'] || ''),
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) {
      return 'error';
    }

    if (res.statusCode >= 400) {
      return 'warn';
    }

    return 'info';
  },
});
