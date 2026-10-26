import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const reqId = (req.headers['x-request-id'] as string) || `req_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  res.locals.requestId = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
}
