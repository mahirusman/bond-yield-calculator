# API

## Base URL

```text
/api/v1
```

In local development the frontend uses:

```text
http://localhost:3001/api/v1
```

## Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-04-25T00:00:00.000Z"
}
```

## Calculate Bond

```http
POST /api/v1/bonds/calculate
```

Request:

```json
{
  "faceValue": "1000",
  "annualCouponRate": "6",
  "marketPrice": "950",
  "yearsToMaturity": "5",
  "couponFrequency": "semi-annual"
}
```

Success response:

```json
{
  "success": true,
  "data": {
    "currentYield": "0.0631578947",
    "ytm": "0.0715724125",
    "totalInterest": "300.00",
    "premiumDiscount": {
      "status": "discount",
      "difference": "50.00"
    },
    "cashFlowSchedule": [],
    "input": {}
  }
}
```

Validation error response:

```json
{
  "success": false,
  "errors": [
    {
      "msg": "Face value must be a positive number",
      "path": "faceValue"
    }
  ],
  "requestId": "..."
}
```

Server error response:

```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "requestId": "..."
  }
}
```

Development responses may include `error.stack`.
