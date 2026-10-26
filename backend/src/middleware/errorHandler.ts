import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';
import { ERROR_CODES } from '../shared';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  logger.error(`Unhandled error during ${req.method} ${req.originalUrl}:`, err);

  if (err instanceof ZodError) {
    const formatted = err.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return sendError(
      res,
      ERROR_CODES.INVALID_AMOUNT,
      'Request validation failed.',
      422,
      formatted
    );
  }

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred while processing your request.'
      : (err as Error)?.message || 'Internal server error';

  return sendError(res, ERROR_CODES.INTERNAL_ERROR, message, 500);
}
