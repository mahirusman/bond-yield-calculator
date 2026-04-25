import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { BondService } from '../services/bond.service';
import { ok, validationError } from '../utils/response';

const bondService = new BondService();

export async function calculateBond(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      validationError(
        res,
        errors.array().map((error) => ({
          msg: error.msg,
          path: error.type === 'field' ? error.path : 'request',
        }))
      );
      return;
    }

    const result = bondService.calculate(req.body);

    ok(res, result);
  } catch (error) {
    next(error);
  }
}
