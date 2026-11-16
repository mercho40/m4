#!/usr/bin/env bash
# neon-branch.sh <branch> <expiry-days>
#
# Create <branch> from $NEON_PARENT (production), or reset it to production's
# current state if it exists. A reset replaces its schema and data, so
# migrations edited after they were applied to the branch are re-applied
# cleanly. Either way the branch expires <expiry-days> from now, a backstop
# for a missed teardown. Needs NEON_API_KEY, NEON_PROJECT_ID and NEON_PARENT.
set -euo pipefail
branch=$1
expires=$(date -u -d "+$2 days" +%Y-%m-%dT%H:%M:%SZ)
if neon branches get "$branch" --project-id "$NEON_PROJECT_ID" >/dev/null 2>&1; then
	neon branches reset "$branch" --parent --project-id "$NEON_PROJECT_ID" >/dev/null
	neon branches set-expiration "$branch" --expires-at "$expires" --project-id "$NEON_PROJECT_ID" >/dev/null
	echo "Reset $branch to $NEON_PARENT (expires $expires)"
else
	# Small compute: preview branches share production's free compute budget.
	neon branches create --project-id "$NEON_PROJECT_ID" --name "$branch" --parent "$NEON_PARENT" \
		--cu 0.25 --no-secrets --expires-at "$expires" >/dev/null
	echo "Created $branch from $NEON_PARENT (expires $expires)"
fi
