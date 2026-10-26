import { Response } from 'express';
import { ApiResponse } from '../shared';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  const requestId = (res.locals.requestId as string) || 'req_unknown';
  const payload: ApiResponse<T> = {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
) {
  const requestId = (res.locals.requestId as string) || 'req_unknown';
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    requestId,
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(payload);
}
