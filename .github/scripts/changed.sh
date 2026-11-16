#!/usr/bin/env bash
# changed.sh <output-name> <path>...
#
# Did any of <path> change since the last successful Deploy run on main?
# Writes <output-name>=true|false to $GITHUB_OUTPUT. Comparing with the last
# *successful* run, not github.event.before, means a run cancelled while
# pending, or one whose deploy failed, never leaves its changes undeployed.
# With no successful run yet (or its commit unreachable), everything counts as
# changed.
set -euo pipefail
name=$1
shift
base=$(gh run list -R "$GITHUB_REPOSITORY" --workflow deploy.yml --branch main \
	--status success --limit 1 --json headSha --jq '.[0].headSha // empty')
if [ -z "$base" ] || ! git cat-file -e "$base^{commit}" 2>/dev/null; then
	echo "$name: no usable previous deploy; treating as changed"
	echo "$name=true" >>"$GITHUB_OUTPUT"
elif git diff --quiet "$base" HEAD -- "$@"; then
	echo "$name: unchanged since ${base::7}"
	echo "$name=false" >>"$GITHUB_OUTPUT"
else
	echo "$name: changed since ${base::7}"
	echo "$name=true" >>"$GITHUB_OUTPUT"
fi
