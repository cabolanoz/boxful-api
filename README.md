# Boxful API

Backend API for the Boxful technical test.

Built with NestJS, TypeScript, Prisma, MongoDB, JWT authentication, order management, shipping rates, COD settlements, and delivery webhooks.

Frontend:

```txt
https://boxful-web.vercel.app/
```

Production API:

```txt
https://boxful-api.onrender.com/api
```

## Requirements

- Node.js 24.15.0
- npm 11+
- MongoDB 7
- MongoDB Shell (`mongosh`)

The project includes `.nvmrc` and `.node-version`.

## Setup

Create the local environment file:

```bash
cp .env.example .env
```

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npm run db:generate
```

Apply the Prisma schema:

```bash
npm run db:push
```

Seed shipping rates:

```bash
npm run db:seed
```

Start the API:

```bash
npm run start:dev
```

The API runs at:

```txt
http://localhost:3000/api
```

The deployed API runs at:

```txt
https://boxful-api.onrender.com/api
```

Health check:

```bash
curl http://localhost:3000/api/health
```

Production health check:

```bash
curl https://boxful-api.onrender.com/api/health
```

## Environment Variables

See `.env.example` for all required variables.

Important values:

```env
DATABASE_URL="mongodb://localhost:27017/boxful_development?replicaSet=rs0&directConnection=true"
JWT_SECRET="CHANGE-ME"
WEBHOOK_SECRET="CHANGE-ME"
CORS_ORIGIN="http://localhost:3001"
```

Production secrets are not committed to the repository. The webhook secret should be shared with reviewers through a private channel, such as email.

## Database Seed

The seed script creates or updates active shipping rates for every weekday.

```bash
npm run db:seed
```

For a clean local database:

```bash
npm run db:reset
```

`db:reset` is destructive. Use it only for local development or review setup.

## Useful Scripts

```bash
npm run start:dev
npm run build
npm run lint
npm run format
npm test
npm run test:e2e
npm run db:generate
npm run db:push
npm run db:seed
```

## More Documentation

- Local MongoDB setup: [documents/LOCAL_DEVELOPMENT.md](documents/LOCAL_DEVELOPMENT.md)
- Orders, COD, settlements, and webhooks: [documents/ORDERS_AND_SETTLEMENTS.md](documents/ORDERS_AND_SETTLEMENTS.md)
- Deployment notes: [documents/DEPLOYMENT.md](documents/DEPLOYMENT.md)
