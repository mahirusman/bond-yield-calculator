import { BondCalculationResult, BondInput } from './bond.types';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    requestId?: string;
    stack?: string;
  };
}

export interface ApiValidationErrorResponse {
  success: false;
  errors: Array<{ msg: string; path: string }>;
  requestId?: string;
}

export type BondCalculateRequest = BondInput;
export type BondCalculateResponse = ApiSuccessResponse<BondCalculationResult>;
