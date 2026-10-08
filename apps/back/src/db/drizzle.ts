import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "#back/db/schema.js";
import { DATABASE_URL } from "#back/lib/env.js";

export const db = drizzle({
  connection: {
    url: DATABASE_URL,
    // Bun's SQL defaults leave connections unbounded in time (idleTimeout 0,
    // maxLifetime 0), which a serverless Postgres endpoint will drop from under
    // the pool. Recycle before that happens.
    //
    // Bun opens every connection up to `max` as soon as the pool is used, so
    // `max` is also how many handshakes a cold pool starts at once. An auth API
    // needs few. `idleTimeout` sits just under the five-minute idle cutoffs
    // common to serverless Postgres and cloud load balancers: long enough that
    // a quiet API keeps warm connections between requests, which a 30s timeout
    // did not.
    max: 4,
    idleTimeout: 240,
    maxLifetime: 1800,
    connectionTimeout: 10,
  },
  schema,
});
