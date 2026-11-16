#!/usr/bin/env bash
# compared-with.sh
#
# What a CI run compares its change with, written to $GITHUB_OUTPUT: base=<sha>
# (a pull request's merge base with its target, a push's previous commit,
# else the merge base with main), and docs_only=true when every file that
# changed since is docs (docs/, Markdown at the root, LICENSE): no task reads
# them, so CI has nothing to check. An empty diff (a
# manual run on main, whose merge base is HEAD) is not that: it runs
# everything. Needs the history (checkout with fetch-depth: 0) and $BEFORE
# (github.event.before) on a push.
set -euo pipefail
case $GITHUB_EVENT_NAME in
pull_request) base=$(git merge-base "origin/$GITHUB_BASE_REF" HEAD) ;;
push) base=$BEFORE ;;
*) base=$(git merge-base origin/main HEAD) ;;
esac
echo "base=$base" >>"$GITHUB_OUTPUT"
if git cat-file -e "$base^{commit}" 2>/dev/null; then
	changed=$(git diff --name-only "$base" HEAD)
	if [ -n "$changed" ] && ! grep -qvE '^(docs/|[^/]+\.md$|LICENSE$)' <<<"$changed"; then
		echo "docs_only=true" >>"$GITHUB_OUTPUT"
	fi
fi
