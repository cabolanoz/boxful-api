# Local Development

## MongoDB Replica Set

Prisma requires MongoDB to run as a replica set because Prisma uses transactions internally for some operations.

For local development, a single-node replica set is enough.

### macOS With Homebrew

Install MongoDB Community Edition:

```bash
brew tap mongodb/brew
brew install mongodb/brew/mongodb-community@7.0
```

Stop MongoDB before editing the config:

```bash
brew services stop mongodb/brew/mongodb-community@7.0
```

Open the config:

```bash
code "$(brew --prefix)/etc/mongod.conf"
```

Add:

```yaml
replication:
  replSetName: rs0
```

Start MongoDB:

```bash
brew services start mongodb/brew/mongodb-community@7.0
```

Verify MongoDB is reachable:

```bash
mongosh --host localhost:27017 --eval "db.adminCommand({ ping: 1 })"
```

Initialize the replica set:

```bash
mongosh --host localhost:27017
```

Inside `mongosh`:

```js
rs.initiate({
  _id: 'rs0',
  members: [{ _id: 0, host: 'localhost:27017' }],
});
```

Verify the node is primary:

```js
rs.status().myState;
```

Expected result:

```txt
1
```

## Database Commands

Generate Prisma Client:

```bash
npm run db:generate
```

Apply the schema:

```bash
npm run db:push
```

Seed shipping rates:

```bash
npm run db:seed
```

Reset local database and seed it again:

```bash
npm run db:reset
```

`db:reset` is destructive. It runs `prisma db push --force-reset` and then `npm run db:seed`.

