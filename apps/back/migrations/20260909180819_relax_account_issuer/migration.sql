-- Better Auth 1.7.0-1.7.2 required account.issuer and keyed account identity on
-- (issuer, account_id). 1.7.3 withdrew that requirement and no longer writes the
-- column, so the NOT NULL rejects every insert -- sign-up returns 500 with
-- "Required columns Better Auth never writes: account.issuer".
--
-- Per the 1.7 upgrade guide, relax rather than drop: existing rows keep their
-- values and a rollback to 1.7.1 stays possible. The index is dropped before the
-- column is relaxed, which the guide calls out as load-bearing on MySQL, where
-- the compound unique index would otherwise silently degrade into a constraint
-- on account_id alone.

DROP INDEX "account_issuer_accountId_idx";--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "issuer" DROP NOT NULL;