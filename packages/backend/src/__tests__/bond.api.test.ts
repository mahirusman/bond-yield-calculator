import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app';

const validPayload = {
  faceValue: '1000',
  annualCouponRate: '6',
  marketPrice: '950',
  yearsToMaturity: '5',
  couponFrequency: 'semi-annual',
} as const;

function getErrorPaths(responseBody: any): string[] {
  return responseBody.errors.map((error: { path: string }) => error.path);
}

describe('POST /api/v1/bonds/calculate — success cases', () => {
  // Resets module state between test groups to keep mocked and non-mocked app instances isolated.
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Validates the canonical semi-annual calculation path.
  it('returns a 10-period schedule for a semi-annual bond', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send(validPayload);

    expect(response.status).toBe(200);
    expect(response.body.data.cashFlowSchedule).toHaveLength(10);
  });

  // Validates annual frequency scheduling.
  it('returns a 3-period schedule for an annual bond', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      couponFrequency: 'annual',
      yearsToMaturity: '3',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.cashFlowSchedule).toHaveLength(3);
  });

  // Validates quarterly frequency scheduling after extending the supported frequency set.
  it('returns an 8-period schedule for a quarterly bond', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      couponFrequency: 'quarterly',
      yearsToMaturity: '2',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.cashFlowSchedule).toHaveLength(8);
  });

  // Validates par bond status classification.
  it('returns par status for an at-par bond', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      marketPrice: '1000',
    });

    expect(response.body.data.premiumDiscount.status).toBe('par');
  });

  // Validates premium bond status classification.
  it('returns premium status for a premium bond', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      marketPrice: '1100',
    });

    expect(response.body.data.premiumDiscount.status).toBe('premium');
  });

  // Validates discount bond status classification.
  it('returns discount status for a discount bond', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send(validPayload);

    expect(response.body.data.premiumDiscount.status).toBe('discount');
  });

  // Validates the overall success payload contract.
  it('returns the expected response shape', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send(validPayload);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        currentYield: expect.any(String),
        ytm: expect.any(String),
        totalInterest: expect.any(String),
        premiumDiscount: expect.any(Object),
        cashFlowSchedule: expect.any(Array),
        input: expect.any(Object),
      },
    });
  });

  // Validates that the API echoes the validated input for UI convenience.
  it('echoes the submitted input back in the response', async () => {
    const payload = {
      faceValue: '1000.50',
      annualCouponRate: '5.75',
      marketPrice: '955.25',
      yearsToMaturity: '7',
      couponFrequency: 'quarterly',
    };
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send(payload);

    expect(response.body.data.input).toEqual(payload);
  });

  // Validates yield fields are returned as decimal strings rather than floats.
  it('returns decimal strings for yield values', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send(validPayload);

    expect(response.body.data.currentYield).toMatch(/^\d+\.\d+$/);
    expect(response.body.data.ytm).toMatch(/^\d+\.\d+$/);
  });

  // Validates money fields keep a two-decimal contract.
  it('returns money values with exactly two decimal places', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send(validPayload);

    expect(response.body.data.totalInterest).toMatch(/^\d+\.\d{2}$/);
  });

  // Validates stability for large face values.
  it('handles a large face value', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      faceValue: '10000000',
      marketPrice: '9950000',
    });

    expect(response.status).toBe(200);
  });

  // Validates decimal input parsing across the API boundary.
  it('handles decimal inputs', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      faceValue: '1000.50',
      marketPrice: '955.25',
      annualCouponRate: '6.25',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.totalInterest).toMatch(/^\d+\.\d{2}$/);
  });

  // Validates short-duration period generation.
  it('handles a 1-year bond', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      yearsToMaturity: '1',
      couponFrequency: 'annual',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.cashFlowSchedule).toHaveLength(1);
  });

  // Validates long-duration period generation.
  it('handles a 30-year bond', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      yearsToMaturity: '30',
      couponFrequency: 'annual',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.cashFlowSchedule).toHaveLength(30);
  });
});

describe('POST /api/v1/bonds/calculate — validation errors', () => {
  // Validates missing faceValue handling.
  it('returns a faceValue error when the field is missing', async () => {
    const { faceValue, ...payload } = validPayload;
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send(payload);

    expect(response.status).toBe(400);
    expect(getErrorPaths(response.body)).toContain('faceValue');
  });

  // Validates zero faceValue handling.
  it('returns a faceValue error when the value is zero', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      faceValue: '0',
    });

    expect(getErrorPaths(response.body)).toContain('faceValue');
  });

  // Validates negative faceValue handling.
  it('returns a faceValue error when the value is negative', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      faceValue: '-500',
    });

    expect(getErrorPaths(response.body)).toContain('faceValue');
  });

  // Validates non-numeric faceValue handling.
  it('returns a faceValue error when the value is non-numeric', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      faceValue: 'abc',
    });

    expect(getErrorPaths(response.body)).toContain('faceValue');
  });

  // Validates empty-string faceValue handling.
  it('returns a faceValue error when the value is empty', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      faceValue: '',
    });

    expect(getErrorPaths(response.body)).toContain('faceValue');
  });

  // Validates missing coupon-rate handling.
  it('returns an annualCouponRate error when the field is missing', async () => {
    const { annualCouponRate, ...payload } = validPayload;
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send(payload);

    expect(getErrorPaths(response.body)).toContain('annualCouponRate');
  });

  // Validates negative coupon-rate handling.
  it('returns an annualCouponRate error when the value is negative', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      annualCouponRate: '-1',
    });

    expect(getErrorPaths(response.body)).toContain('annualCouponRate');
  });

  // Validates non-numeric coupon-rate handling.
  it('returns an annualCouponRate error when the value is non-numeric', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      annualCouponRate: 'high',
    });

    expect(getErrorPaths(response.body)).toContain('annualCouponRate');
  });

  // Validates empty coupon-rate handling.
  it('returns an annualCouponRate error when the value is empty', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      annualCouponRate: '',
    });

    expect(getErrorPaths(response.body)).toContain('annualCouponRate');
  });

  // Validates missing marketPrice handling.
  it('returns a marketPrice error when the field is missing', async () => {
    const { marketPrice, ...payload } = validPayload;
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send(payload);

    expect(getErrorPaths(response.body)).toContain('marketPrice');
  });

  // Validates zero marketPrice handling.
  it('returns a marketPrice error when the value is zero', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      marketPrice: '0',
    });

    expect(getErrorPaths(response.body)).toContain('marketPrice');
  });

  // Validates negative marketPrice handling.
  it('returns a marketPrice error when the value is negative', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      marketPrice: '-100',
    });

    expect(getErrorPaths(response.body)).toContain('marketPrice');
  });

  // Validates non-numeric marketPrice handling.
  it('returns a marketPrice error when the value is non-numeric', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      marketPrice: 'expensive',
    });

    expect(getErrorPaths(response.body)).toContain('marketPrice');
  });

  // Validates missing yearsToMaturity handling.
  it('returns a yearsToMaturity error when the field is missing', async () => {
    const { yearsToMaturity, ...payload } = validPayload;
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send(payload);

    expect(getErrorPaths(response.body)).toContain('yearsToMaturity');
  });

  // Validates zero yearsToMaturity handling.
  it('returns a yearsToMaturity error when the value is zero', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      yearsToMaturity: '0',
    });

    expect(getErrorPaths(response.body)).toContain('yearsToMaturity');
  });

  // Validates negative yearsToMaturity handling.
  it('returns a yearsToMaturity error when the value is negative', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      yearsToMaturity: '-3',
    });

    expect(getErrorPaths(response.body)).toContain('yearsToMaturity');
  });

  // Validates non-numeric yearsToMaturity handling.
  it('returns a yearsToMaturity error when the value is non-numeric', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      yearsToMaturity: 'five',
    });

    expect(getErrorPaths(response.body)).toContain('yearsToMaturity');
  });

  // Validates missing couponFrequency handling.
  it('returns a couponFrequency error when the field is missing', async () => {
    const { couponFrequency, ...payload } = validPayload;
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send(payload);

    expect(getErrorPaths(response.body)).toContain('couponFrequency');
  });

  // Validates invalid couponFrequency enum handling.
  it('returns a couponFrequency error when the value is invalid', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      couponFrequency: 'monthly',
    });

    expect(getErrorPaths(response.body)).toContain('couponFrequency');
  });

  // Validates case-sensitive couponFrequency handling.
  it('returns a couponFrequency error when the value casing is wrong', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      couponFrequency: 'Semi-Annual',
    });

    expect(getErrorPaths(response.body)).toContain('couponFrequency');
  });

  // Validates empty couponFrequency handling.
  it('returns a couponFrequency error when the value is empty', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      ...validPayload,
      couponFrequency: '',
    });

    expect(getErrorPaths(response.body)).toContain('couponFrequency');
  });

  // Validates that an empty body produces multiple validation errors.
  it('returns multiple errors for an empty body', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({});

    expect(response.status).toBe(400);
    expect(response.body.errors.length).toBeGreaterThan(1);
  });

  // Validates that multiple empty-string fields are all reported.
  it('returns multiple errors for all-empty-string values', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({
      faceValue: '',
      annualCouponRate: '',
      marketPrice: '',
      yearsToMaturity: '',
      couponFrequency: '',
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.length).toBeGreaterThan(1);
  });
});

describe('GET /health', () => {
  // Validates the health endpoint status code.
  it('returns 200 from the health endpoint', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.status).toBe(200);
  });

  // Validates the presence of a truthy service health payload.
  it('returns a truthy health payload', async () => {
    const response = await request(createApp()).get('/health');

    expect(response.body.status).toBe('ok');
  });
});

describe('Error response shape', () => {
  // Validates the common 400 error envelope used for validation responses.
  it('returns success=false and a non-empty errors array for 400 responses', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({});

    expect(response.body.success).toBe(false);
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  // Validates that each validation error exposes a message and a path.
  it('returns msg and path on each validation error object', async () => {
    const response = await request(createApp()).post('/api/v1/bonds/calculate').send({});
    const firstError = response.body.errors[0];

    expect(firstError).toEqual(
      expect.objectContaining({
        msg: expect.any(String),
        path: expect.any(String),
      })
    );
  });

  // Validates the centralized 500 error shape when the service layer throws unexpectedly.
  it('returns the standardized 500 error payload when calculation fails', async () => {
    vi.resetModules();
    vi.doMock('../services/bond.service', () => ({
      BondService: class MockBondService {
        calculate() {
          throw new Error('Boom');
        }
      },
    }));

    const { createApp: createMockedApp } = await import('../app');
    const response = await request(createMockedApp()).post('/api/v1/bonds/calculate').send(validPayload);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: {
        message: 'Boom',
      },
    });

    vi.resetModules();
    vi.doUnmock('../services/bond.service');
  });
});
