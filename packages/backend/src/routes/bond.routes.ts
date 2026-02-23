import { Router } from 'express';
import { calculateBond } from '../controllers/bond.controller';
import { validateBondInput } from '../validators/bond.validator';

const router = Router();

// POST /api/v1/bonds/calculate
router.post('/bonds/calculate', validateBondInput, calculateBond);

export default router;
