# Boxful API

Backend API for the Boxful Full Stack Engineer technical test.

This project is built with NestJS, TypeScript, Prisma ORM, and MongoDB. The API will provide authentication, order management, searchable order history, and optional settlement logic for cash-on-delivery orders.

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
npm run db:seed
```

Runs the database seed script.

## Project Structure

Current structure:

```txt
boxful-api/
  prisma/
    schema.prisma

  src/
    app.controller.ts
    app.module.ts
    app.service.ts
    main.ts

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

Planned structure:

```txt
src/
  auth/
  users/
  orders/
  prisma/
  common/
  config/
  shipping-rates/
  settlements/
  webhooks/
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

## Development Plan

Initial API scope:

- Health endpoint
- Prisma setup
- Authentication with JWT
- Users module
- Orders module
- Searchable order history
- CSV export support
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
