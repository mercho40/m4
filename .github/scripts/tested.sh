#!/usr/bin/env bash
# tested.sh
#
# For a commit on main: did CI's Test job already pass on exactly this tree,
# in the pull request this commit squashes? Writes tested=true|false to
# $GITHUB_OUTPUT; with false, deploy.yml runs Test before deploying.
#
# A pull_request run tests the PR's head merged into its base as it was then.
# When the head's tree equals the squash commit's, that merge was this very
# tree: had main gained anything the head lacked, the squash would carry it and
# the trees would differ. A PR that was up to date with main when it merged
# (which branch protection requires) is never tested twice; anything else, a
# direct push or a manual run included, is tested here first.
set -euo pipefail
no() {
	echo "$1: testing it before deploying."
	echo "tested=false" >>"$GITHUB_OUTPUT"
	exit 0
}
repo=$GITHUB_REPOSITORY
[ "$GITHUB_EVENT_NAME" = push ] || no "not a push"
head=$(gh api "repos/$repo/commits/$GITHUB_SHA/pulls" \
	--jq '[.[] | select(.merged_at != null and .base.ref == "main")][0].head.sha // empty') ||
	no "could not look up the pull request"
[ -n "$head" ] || no "no merged pull request for ${GITHUB_SHA::7}"
tree() { gh api "repos/$repo/commits/$1" --jq .commit.tree.sha; }
# Assigned first: a failure inside `[ … ]` would not stop the script, and two
# failed lookups would compare equal.
head_tree=$(tree "$head") || no "could not read ${head::7}'s tree"
this_tree=$(tree "$GITHUB_SHA") || no "could not read ${GITHUB_SHA::7}'s tree"
[ -n "$head_tree" ] && [ -n "$this_tree" ] || no "a tree lookup answered nothing"
[ "$head_tree" = "$this_tree" ] ||
	no "the pull request's head ${head::7} is not this tree (it was behind main when it merged)"
run=$(gh api "repos/$repo/actions/workflows/ci.yml/runs?head_sha=$head&event=pull_request&status=success&per_page=1" \
	--jq '.workflow_runs[0].id // empty') || no "could not look up CI's runs"
[ -n "$run" ] || no "no successful CI run for ${head::7}"
passed=$(gh api "repos/$repo/actions/runs/$run/jobs" \
	--jq '[.jobs[] | select(.name == "Test" and .conclusion == "success")] | length') ||
	no "could not read run $run's jobs"
[ "$passed" -ge 1 ] || no "run $run has no passing Test job"
echo "CI run $run passed Test on ${head::7}, whose tree is this commit's."
echo "tested=true" >>"$GITHUB_OUTPUT"
