import { defineRelations } from "drizzle-orm";
import * as schema from "#back/db/schema.js";

// Relational Queries v2, which Drizzle 1.0 requires. Better Auth's joined
// reads (`advanced.database.joins`) go through these, keyed by the names its
// generator emits: one-to-many as the plural (`sessions`), the owner as `user`.
export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session({ from: r.user.id, to: r.session.userId }),
    accounts: r.many.account({ from: r.user.id, to: r.account.userId }),
  },
  session: {
    user: r.one.user({ from: r.session.userId, to: r.user.id }),
  },
  account: {
    user: r.one.user({ from: r.account.userId, to: r.user.id }),
  },
}));
