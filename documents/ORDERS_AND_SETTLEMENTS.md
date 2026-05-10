# Orders And Settlements

Production API base URL:

```txt
https://boxful-api.onrender.com/api
```

Local API base URL:

```txt
http://localhost:3000/api
```

## Shipping Rates

Orders store the shipping cost that was active on their scheduled date. This keeps historical orders stable when rates change later.

The seed creates one active rate per weekday:

```txt
MONDAY     4.00
TUESDAY    4.00
WEDNESDAY  4.50
THURSDAY   4.50
FRIDAY     5.00
SATURDAY   6.00
SUNDAY     6.00
```

## Standard Orders

Standard orders do not collect money from the final customer.

```txt
codCommission = 0
settlementAmount = -shippingCost
```

Example:

```json
{
  "pickupAddress": "Masaya",
  "scheduledDate": "2026-05-11",
  "recipient": {
    "firstName": "Rebeca",
    "lastName": "Montenegro",
    "email": "rebeca@boxful.com",
    "phoneCountryCode": "505",
    "phoneNumber": "55555555",
    "address": "Masaya",
    "department": "Masaya",
    "municipality": "Masaya"
  },
  "packages": [
    {
      "lengthCm": 15,
      "heightCm": 15,
      "widthCm": 15,
      "weightPounds": 3,
      "content": "Phone"
    }
  ]
}
```

## COD Orders

COD orders require `paymentMode: "COD"` and `expectedCollectionAmount`.

Before delivery, `collectedAmount` is empty and settlement starts negative:

```txt
codCommission = 0
settlementAmount = -shippingCost
```

When the real collected amount arrives:

```txt
codCommission = min(collectedAmount * 0.0001, 25)
settlementAmount = collectedAmount - shippingCost - codCommission
```

The real `collectedAmount` is used for final settlement, not the initial expected amount.

Example:

```json
{
  "pickupAddress": "Masaya",
  "scheduledDate": "2026-05-11",
  "paymentMode": "COD",
  "expectedCollectionAmount": 100,
  "recipient": {
    "firstName": "Marlon",
    "lastName": "Alarcon",
    "email": "marlon@boxful.com",
    "phoneCountryCode": "505",
    "phoneNumber": "55555555",
    "address": "Ticuantepe",
    "department": "Ticuantepe",
    "municipality": "Ticuantepe"
  },
  "packages": [
    {
      "lengthCm": 15,
      "heightCm": 15,
      "widthCm": 15,
      "weightPounds": 3,
      "content": "Phone"
    }
  ]
}
```

## Manual Status Update

Authenticated users can update one of their own order statuses:

```txt
PATCH /api/orders/:id/status
```

Payload:

```json
{
  "status": "IN_TRANSIT"
}
```

For COD delivery, `collectedAmount` can be sent too:

```json
{
  "status": "DELIVERED",
  "collectedAmount": 115
}
```

This recalculates `codCommission` and `settlementAmount`.

## Delivery Webhook

External systems can also update delivered orders by tracking code:

```txt
POST /api/webhooks/orders/delivery
```

Required header:

```txt
x-webhook-secret: value-from-WEBHOOK_SECRET
```

The production webhook secret is not stored in the repository. It should be shared with reviewers through a private channel, such as email.

Example:

```bash
curl -X POST https://boxful-api.onrender.com/api/webhooks/orders/delivery \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <WEBHOOK_SECRET_SENT_BY_EMAIL>" \
  -d '{
    "trackingCode": "BOX-12345678",
    "status": "DELIVERED",
    "collectedAmount": 115
  }'
```

For local development, use the local base URL and the `WEBHOOK_SECRET` value from your `.env` file:

```bash
curl -X POST http://localhost:3000/api/webhooks/orders/delivery \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: CHANGE-ME" \
  -d '{
    "trackingCode": "BOX-12345678",
    "status": "DELIVERED",
    "collectedAmount": 115
  }'
```

The webhook:

- validates `x-webhook-secret`
- updates order status
- stores `collectedAmount` when present
- sets `deliveredAt` for delivered orders
- sets `paidAt` for COD orders with a collected amount
- recalculates `codCommission` and `settlementAmount`
