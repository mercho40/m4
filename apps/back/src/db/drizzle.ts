import { drizzle } from 'drizzle-orm/bun-sql';
// import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "./schema";
import { DATABASE_URL } from "#back/lib/env.js";

export const db = drizzle({
  connection: {
    url: DATABASE_URL,
    // Bun's SQL defaults leave connections unbounded in time (idleTimeout 0,
    // maxLifetime 0), which a serverless Postgres endpoint will drop from under
    // the pool. Recycle before that happens.
    max: 10,
    idleTimeout: 30,
    maxLifetime: 1800,
    connectionTimeout: 10,
  },
  schema,
});
