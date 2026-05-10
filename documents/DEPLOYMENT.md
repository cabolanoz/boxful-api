# Deployment

## Current Frontend

The frontend is deployed at:

```txt
https://boxful-web.vercel.app/
```

The backend API is deployed at:

```txt
https://boxful-api.onrender.com/api
```

## MongoDB Atlas

Use a MongoDB Atlas connection string in production:

```env
DATABASE_URL="mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/boxful_production?retryWrites=true&w=majority"
```

Do not use the local `directConnection=true` URL in Atlas.

Apply schema and seed rates against Atlas:

```bash
DATABASE_URL="mongodb+srv://..." npm run db:push
DATABASE_URL="mongodb+srv://..." npm run db:seed
```

Avoid `db:reset` in production-like databases unless you intentionally want to delete all data.

## Backend Hosting

The current production backend is hosted on Render:

```txt
https://boxful-api.onrender.com/api
```

The notes below also apply to Railway or any Node.js host that supports environment variables and a start command.

## Railway Or Render Backend

Suggested build command:

```bash
npm run db:generate && npm run build
```

Suggested start command:

```bash
npm run start:prod
```

Required environment variables:

```env
NODE_ENV=production
DATABASE_URL="mongodb+srv://..."
JWT_SECRET="CHANGE-ME"
JWT_EXPIRES_IN="1d"
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN="https://boxful-web.vercel.app"
WEBHOOK_SECRET="CHANGE-ME"
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

Do not commit production secrets. Share `WEBHOOK_SECRET` with reviewers through a private channel, such as email.

Railway and Render provide `PORT`, so it does not need to be set manually.
