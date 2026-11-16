#!/usr/bin/env bash
# single-copies.sh
#
# Do the workspaces that must share a package resolve the same copy of it?
# Bun's isolated linker makes a copy per distinct set of resolved peers, so a
# dependency change can split one silently (AGENTS.md, "Both apps must
# resolve the same elysia copy"):
# - elysia: apps/back and apps/web, or treaty<App> fails to type-check;
# - typescript: one of elysia's optional peers, so a second copy splits elysia;
# - better-auth: the API's server and the web app's client share its types;
# - @better-auth/core and drizzle-orm: the Drizzle adapter must use the ones
#   the API's better-auth and the API itself use.
# Run from the repository root after `bun install`.
set -euo pipefail
failed=0

same() { # same <package> <workspace>...
	local package=$1 first="" path
	shift
	for workspace in "$@"; do
		path=$(realpath "$workspace/node_modules/$package")
		first=${first:-$path}
		if [ "$path" != "$first" ]; then
			echo "::error::$workspace resolves another copy of $package: ${path#"$PWD"/} (not ${first#"$PWD"/})"
			failed=1
		fi
	done
}

# beside <workspace> <package> <dependency>: the <dependency> that <package>,
# as <workspace> resolves it, sees. Bun's store links a package's
# dependencies next to it; a scoped package sits one directory deeper.
beside() {
	local dir
	dir=$(dirname "$(realpath "$1/node_modules/$2")")
	case $2 in @*/*) dir=$(dirname "$dir") ;; esac
	realpath "$dir/$3"
}

agree() { # agree <what> <path> <path>
	if [ "$2" != "$3" ]; then
		echo "::error::$1: ${2#"$PWD"/} is not ${3#"$PWD"/}"
		failed=1
	fi
}

same elysia apps/back apps/web
same typescript apps/back apps/web
same better-auth apps/back apps/web
agree "the Drizzle adapter's @better-auth/core is not better-auth's" \
	"$(beside apps/back @better-auth/drizzle-adapter @better-auth/core)" \
	"$(beside apps/back better-auth @better-auth/core)"
agree "the Drizzle adapter's drizzle-orm is not apps/back's" \
	"$(beside apps/back @better-auth/drizzle-adapter drizzle-orm)" \
	"$(realpath apps/back/node_modules/drizzle-orm)"

[ "$failed" = 0 ] && echo "One copy of each shared package."
exit "$failed"
