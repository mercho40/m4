#!/usr/bin/env bash
# migrations-unchanged.sh <base-commit>
#
# Fails when a migration.sql that exists at <base> was edited, deleted or
# renamed by HEAD. Every folder on main may already be applied in
# production, and Drizzle's migrator picks what to run by folder name alone:
# it stores each file's hash but never compares it. So an edited migration is
# skipped silently wherever it already ran, and a renamed one (a delete plus
# an add here) runs again.
set -euo pipefail
base=${1:-}
if [ -z "$base" ] || ! git cat-file -e "$base^{commit}" 2>/dev/null; then
	echo "::warning::base commit '$base' is not in this clone; skipping the applied-migration check"
	exit 0
fi
failed=0
while IFS=$'\t' read -r status path; do
	case $status in
	A) ;;
	D)
		echo "::error file=$path::$path is already applied; never delete or rename it (the migrator would run it again under a new name)."
		failed=1
		;;
	*)
		echo "::error file=$path::$path is already applied; never edit it. Add a new migration instead."
		failed=1
		;;
	esac
done < <(git diff --no-renames --name-status "$base" HEAD -- 'apps/back/migrations/*/migration.sql')
exit "$failed"
