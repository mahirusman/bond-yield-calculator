import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { BondService } from '../services/bond.service';

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
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const result = bondService.calculate(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
