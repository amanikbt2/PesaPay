import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sendError } from '../utils/response';
import { ERROR_CODES } from '../shared';

export interface AuthenticatedUser {
  id: string;
  phoneNumber?: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthenticatedUser;
      res.locals.user = decoded;
      return next();
    } catch {
      return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Invalid or expired session token.', 401);
    }
  }

  // In development mode, provide a fallback user context if no token is passed
  if (env.NODE_ENV !== 'production') {
    res.locals.user = {
      id: 'dev-student-user-001',
      phoneNumber: '254712345678',
    };
    return next();
  }

  return sendError(res, ERROR_CODES.UNAUTHORIZED, 'Authentication token required.', 401);
}
