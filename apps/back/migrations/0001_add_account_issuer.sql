-- Better Auth >= 1.7 scopes account identity by `issuer` instead of `provider_id`.
-- The generated form (ADD COLUMN ... NOT NULL in one step) cannot run against a
-- table that already holds rows, so this adds the column nullable, backfills it
-- with the issuer each provider actually produces, and only then enforces the
-- constraint.
--
-- Issuer values come from @better-auth/core/db:
--   createLocalAccountIssuer(id) -> "local:<id>"        (credential accounts)
--   createOAuthAccountIssuer(id) -> "local:oauth:<id>"  (OAuth, no declared issuer)
-- A provider may also declare its own; google declares "https://accounts.google.com".

ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint

UPDATE "account" SET "issuer" = 'local:credential' WHERE "provider_id" = 'credential';--> statement-breakpoint
UPDATE "account" SET "issuer" = 'https://accounts.google.com' WHERE "provider_id" = 'google';--> statement-breakpoint
UPDATE "account" SET "issuer" = 'local:oauth:github' WHERE "provider_id" = 'github';--> statement-breakpoint

-- Any provider added later without an explicit mapping above falls back to the
-- OAuth-namespaced default rather than blocking the migration.
UPDATE "account" SET "issuer" = 'local:oauth:' || "provider_id" WHERE "issuer" IS NULL;--> statement-breakpoint

ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_idx" ON "account" USING btree ("issuer","account_id");
