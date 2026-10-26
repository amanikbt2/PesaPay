import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../db';
import { sendSuccess } from '../utils/response';
import { UserSessionDTO } from '../shared';
import { v4 as uuidv4 } from 'uuid';

export class AuthController {
  async getOrCreateSession(req: Request, res: Response, next: NextFunction) {
    try {
      const requestedPhone = req.body.phoneNumber || '254712345678';
      let user = await prisma.user.findFirst({
        where: { phoneNumber: requestedPhone },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: `usr_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
            displayName: req.body.displayName || 'Student User',
            phoneNumber: requestedPhone,
          },
        });
      }

      // Generate signed JWT token
      const token = jwt.sign(
        { id: user.id, phoneNumber: user.phoneNumber },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '7d' }
      );

      const session: UserSessionDTO = {
        userId: user.id,
        token,
      };

      return sendSuccess(res, session);
    } catch (err) {
      return next(err);
    }
  }
}

export const authController = new AuthController();
