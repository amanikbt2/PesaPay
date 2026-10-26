import { Request, Response } from 'express';
import { prisma } from '../db';
import { env } from '../config/env';
import { sendSuccess, sendError } from '../utils/response';
import { ConnectivityStatus } from '../shared';

export class HealthController {
  getHealth(req: Request, res: Response) {
    return sendSuccess(res, {
      status: 'healthy',
      service: 'pesapay-api',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  }

  async getReady(req: Request, res: Response) {
    try {
      // Test database connectivity
      await prisma.$queryRaw`SELECT 1`;
      return sendSuccess(res, {
        status: 'ready',
        database: 'connected',
        provider: env.PAYMENT_PROVIDER,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return sendError(
        res,
        'DEPENDENCY_UNAVAILABLE',
        'Database connection is not ready.',
        503,
        err.message
      );
    }
  }

  getConnectivity(req: Request, res: Response) {
    const data: ConnectivityStatus = {
      status: 'ok',
      providerMode: env.PAYMENT_PROVIDER,
      darajaConfigured: Boolean(
        env.MPESA_CONSUMER_KEY && env.MPESA_CONSUMER_SECRET && env.MPESA_PASSKEY
      ),
      serverTime: new Date().toISOString(),
    };
    return sendSuccess(res, data);
  }
}

export const healthController = new HealthController();
