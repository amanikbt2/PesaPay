import { Request, Response, NextFunction } from 'express';
import { merchantService } from '../services/merchant.service';
import { ResolveQrRequestSchema } from '../shared';
import { sendSuccess, sendError } from '../utils/response';

export class MerchantController {
  async resolveQr(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = ResolveQrRequestSchema.parse(req.body);
      const merchant = await merchantService.resolveAndVerifyMerchant(validated.rawPayload);
      return sendSuccess(res, merchant);
    } catch (err: any) {
      if (err.statusCode) {
        return sendError(res, err.code, err.message, err.statusCode);
      }
      return next(err);
    }
  }

  async getMerchant(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const merchant = await merchantService.getMerchantById(id);
      if (!merchant) {
        return sendError(res, 'MERCHANT_NOT_FOUND', 'Merchant not found', 404);
      }
      return sendSuccess(res, merchant);
    } catch (err) {
      return next(err);
    }
  }
}

export const merchantController = new MerchantController();
