# Boxful API

Backend API for the Boxful Full Stack Engineer technical test.

This project is built with NestJS, TypeScript, Prisma ORM, and MongoDB. The API provides authentication, user management, order management, searchable order history, configurable shipping rates, and settlement logic for cash-on-delivery orders.

## Tech Stack

- Node.js 24.15.0
- NestJS
- TypeScript
- MongoDB 7
- Prisma ORM 6.19.0
- Jest
- Supertest
- ESLint
- Prettier

## Requirements

Before running the project, make sure you have installed:

- Node.js 24.15.0
- npm 11 or newer
- MongoDB Community Server 7
- MongoDB Shell (`mongosh`)

The project includes `.nvmrc` and `.node-version` files to make the Node.js version explicit.

```bash
node -v
npm -v
mongod --version
mongosh --version
```

Expected Node.js version:

```bash
v24.15.0
```

## Environment Variables

Create a local `.env` file from the provided example:

```bash
cp .env.example .env
```

The local development values should look similar to this:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="mongodb://localhost:27017/boxful_development?replicaSet=rs0&directConnection=true"

JWT_SECRET="CHANGE-ME"
JWT_EXPIRES_IN="1d"

BCRYPT_SALT_ROUNDS=12

CORS_ORIGIN="http://localhost:3001"
WEBHOOK_SECRET="CHANGE-ME"

THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

## MongoDB Local Setup

Prisma requires MongoDB to run as a replica set because Prisma uses transactions internally for certain operations.

For local development, this project uses a single-node MongoDB replica set.

### macOS with Homebrew

Start by installing MongoDB Community Edition if it is not already installed:

```bash
brew tap mongodb/brew
brew install mongodb/brew/mongodb-community@7.0
```

Stop the MongoDB service before changing the configuration:

```bash
brew services stop mongodb/brew/mongodb-community@7.0
```

Open the MongoDB configuration file:

```bash
code "$(brew --prefix)/etc/mongod.conf"
```

If you do not use VS Code:

```bash
nano "$(brew --prefix)/etc/mongod.conf"
```

Add the following section if it does not already exist:

```yaml
replication:
  replSetName: rs0
```

The configuration file should look similar to this:

```yaml
systemLog:
  destination: file
  path: /opt/homebrew/var/log/mongodb/mongo.log
  logAppend: true

storage:
  dbPath: /opt/homebrew/var/mongodb

net:
  bindIp: 127.0.0.1, ::1
  port: 27017

replication:
  replSetName: rs0
```

Start MongoDB again:

```bash
brew services start mongodb/brew/mongodb-community@7.0
```

Verify that MongoDB is running:

```bash
mongosh --host localhost:27017 --eval "db.adminCommand({ ping: 1 })"
```

Initialize the replica set:

```bash
mongosh --host localhost:27017
```

Inside `mongosh`, run:

```js
rs.initiate({
  _id: 'rs0',
  members: [{ _id: 0, host: 'localhost:27017' }],
});
```

Then verify the node is primary:

```js
rs.status().myState;
```

Expected result:

```txt
1
```

A result of `1` means the local MongoDB node is the replica set primary.

## Installation

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npm run db:generate
```

Apply the Prisma schema to MongoDB:

```bash
npm run db:push
```

Seed the shipping rates used when orders are created:

```bash
npm run db:seed
```

For a clean local setup, reset the MongoDB database and seed it in one step:

```bash
npm run db:reset
```

`db:reset` uses `prisma db push --force-reset`, so it deletes local data in the configured `DATABASE_URL`. It then runs `prisma/seed.ts`, which upserts one active shipping rate for each day of the week.

Start the API in development mode:

```bash
npm run start:dev
```

The API should be available at:

```txt
http://localhost:3000
```

The health endpoint is available at:

```txt
GET /api/health
```

Example:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "boxful-api",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## Available Scripts

```bash
npm run start:dev
```

Runs the API in watch mode.

```bash
npm run build
```

Builds the NestJS application.

```bash
npm run lint
```

Runs ESLint and fixes issues when possible.

```bash
npm run format
```

Formats the source and test files with Prettier.

```bash
npm test
```

Runs unit tests.

```bash
npm run test:e2e
```

Runs end-to-end tests.

```bash
npm run db:generate
```

Generates Prisma Client.

```bash
npm run db:push
```

Pushes the Prisma schema to MongoDB.

```bash
npm run db:reset
```

Resets the configured MongoDB database, applies the Prisma schema, and seeds shipping rates. This is destructive and should only be used for local development or review setup.

```bash
npm run db:seed
```

Runs the database seed script. The current seed creates or updates active shipping rates:

```txt
MONDAY     4.00
TUESDAY    4.00
WEDNESDAY  4.50
THURSDAY   4.50
FRIDAY     5.00
SATURDAY   6.00
SUNDAY     6.00
```

## Orders, COD, And Settlements

Every order stores the shipping cost that was active on its scheduled date. This keeps historical orders stable if shipping rates change later.

Standard orders use the default payment mode:

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
    "municipality": "Masaya",
    "referencePoint": "Casa color verde",
    "instructions": "Cuidado con el perro"
  },
  "packages": [
    {
      "lengthCm": 15,
      "heightCm": 15,
      "widthCm": 15,
      "weightPounds": 3,
      "content": "iPhone 14 Pro Max"
    }
  ]
}
```

For standard orders:

```txt
settlementAmount = -shippingCost
codCommission = 0
```

COD orders require `paymentMode: "COD"` and `expectedCollectionAmount`:

```json
{
  "pickupAddress": "Masaya",
  "scheduledDate": "2026-05-11",
  "paymentMode": "COD",
  "expectedCollectionAmount": 100,
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

Before delivery, COD orders keep `collectedAmount` empty and start with:

```txt
settlementAmount = -shippingCost
codCommission = 0
```

When the real collected amount arrives, the API recalculates with:

```txt
codCommission = min(collectedAmount * 0.0001, 25)
settlementAmount = collectedAmount - shippingCost - codCommission
```

The real `collectedAmount` is used for final settlement, not the initial expected amount.

## Delivery Webhook

The delivery webhook updates an order by tracking code and recalculates COD settlement when a real collected amount is provided.

Endpoint:

```txt
POST /api/webhooks/orders/delivery
```

Required header:

```txt
x-webhook-secret: value-from-WEBHOOK_SECRET
```

Example:

```bash
curl -X POST http://localhost:3000/api/webhooks/orders/delivery \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: CHANGE-ME" \
  -d '{
    "trackingCode": "BOX-12345678",
    "status": "DELIVERED",
    "collectedAmount": 15
  }'
```

The webhook:

- validates `x-webhook-secret` against `WEBHOOK_SECRET`
- returns `401` when the secret is invalid
- returns `404` when the tracking code does not exist
- updates order status
- stores `collectedAmount` when present
- sets `deliveredAt` for delivered orders
- sets `paidAt` for COD orders with a collected amount
- recalculates `codCommission` and `settlementAmount`

## Project Structure

Current structure:

```txt
boxful-api/
  prisma/
    schema.prisma
    seed.ts

  src/
    auth/
    common/
    orders/
    prisma/
    settlements/
    shipping-rates/
    users/
    webhooks/

  test/
    app.e2e-spec.ts
    jest-e2e.json

  .env.example
  .node-version
  .nvmrc
  eslint.config.mjs
  nest-cli.json
  package.json
  tsconfig.json
```

## Technical Notes

### Prisma and MongoDB

MongoDB does not enforce a relational schema in the same way as SQL databases. Prisma provides a typed application-level schema, generated client, indexes, and model definitions.

For MongoDB, this project uses:

```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}
```

### Replica Set Requirement

MongoDB must run as a replica set because Prisma relies on MongoDB transactions for some operations. For local development, a single-node replica set is enough.

### Docker Status

Docker support was explored during the initial setup, but the current local development workflow uses MongoDB installed locally with Homebrew. This keeps the setup predictable while the API is being implemented.

Docker can be revisited once the core API functionality is complete.

## Implemented Scope

Current API scope:

- Health endpoint
- Prisma setup
- Authentication with JWT
- Users module
- Orders module
- Searchable order history
- Shipping rate configuration
- COD settlement calculation
- Webhook endpoint for delivery/payment updates

## CI

This repository uses GitHub Actions.

The current CI pipeline runs:

- dependency installation
- Prisma Client generation
- Prisma schema validation
- linting
- build
- unit tests
- e2e tests

The workflow file is located at:

```txt
.github/workflows/ci.yml
```

## Commit Style

Use clear English commit messages.

Example:

```bash
git commit -m "Initialize NestJS API with Prisma and CI"
```
