import { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';
import { fail } from '../utils/response';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const message =
    statusCode >= 500 && !config.isDevelopment ? 'Internal server error' : err.message;

  logger.error({
    err,
    requestId: res.locals.requestId,
    statusCode,
  });

  fail(
    res,
    statusCode,
    message || 'Internal server error',
    config.isDevelopment ? err.stack : undefined
  );
}
