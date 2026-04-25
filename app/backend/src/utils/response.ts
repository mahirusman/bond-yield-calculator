import { Response } from 'express';

interface ValidationError {
  msg: string;
  path: string;
}

function getRequestId(res: Response): string | undefined {
  return res.locals.requestId;
}

export function ok<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

export function validationError(res: Response, errors: ValidationError[]): void {
  res.status(400).json({
    success: false,
    errors,
    requestId: getRequestId(res),
  });
}

export function fail(res: Response, statusCode: number, message: string, stack?: string): void {
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      requestId: getRequestId(res),
      ...(stack && { stack }),
    },
  });
}

export function notFound(res: Response, message = 'Route not found'): void {
  fail(res, 404, message);
}
