#!/usr/bin/env bash
# neon-url.sh <branch>
#
# Export the branch's direct (non-pooled) connection string as DATABASE_URL
# for the following steps, masked first. A child branch inherits production's
# role passwords, so an unmasked value in a log would leak production's.
# Needs NEON_API_KEY, NEON_PROJECT_ID, NEON_ROLE and NEON_DATABASE.
set -euo pipefail
url=$(neon connection-string "$1" --project-id "$NEON_PROJECT_ID" \
	--role-name "$NEON_ROLE" --database-name "$NEON_DATABASE")
password=$(node -e 'process.stdout.write(decodeURIComponent(new URL(process.argv[1]).password))' "$url")
echo "::add-mask::$password"
echo "::add-mask::$url"
echo "DATABASE_URL=$url" >>"$GITHUB_ENV"
