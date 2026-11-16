#!/usr/bin/env bash
# smoke.sh: the compiled API (./server, `bun run build`) in production mode,
# from the outside, as CI's Test job runs it. It needs a migrated database at
# DATABASE_URL and a production-shaped environment: NODE_ENV=production,
# BETTER_AUTH_SECRET, an https BETTER_AUTH_URL, WEB_URL, COOKIE_DOMAIN (the
# parent of both) and PORT. The hosts need not resolve: Better Auth never
# calls its own URL. Run from apps/back.
set -euo pipefail

logs=$(mktemp -d)
fail() {
	echo "::error::$*"
	cat "$logs/server.log" 2>/dev/null || true
	exit 1
}

./server >"$logs/server.log" 2>&1 &
pid=$!
trap 'kill -KILL "$pid" 2>/dev/null || true' EXIT
api=http://localhost:$PORT

curl --retry 20 --retry-delay 1 --retry-connrefused -fsS -o "$logs/health.json" "$api/health" ||
	fail "GET /health never answered"
jq -e '.status == "ok"' "$logs/health.json" >/dev/null || fail "GET /health answered $(cat "$logs/health.json")"

# Better Auth is mounted and reaches the database: no cookie, no session.
body=$(curl -fsS "$api/api/auth/get-session") || fail "GET /api/auth/get-session failed"
[ "$body" = null ] || fail "GET /api/auth/get-session without a cookie answered $body; it must be null"

# A sign-up writes the user, account and session tables (so the migrations
# match the schema), and its session cookie is scoped to COOKIE_DOMAIN and
# Secure, or the web app on its sibling subdomain would never receive it.
email="smoke-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-$$}@example.com"
code=$(curl -sS -o "$logs/signup.json" -D "$logs/signup.headers" -w '%{http_code}' -X POST \
	-H "Origin: $WEB_URL" -H 'Content-Type: application/json' \
	-d "{\"email\":\"$email\",\"password\":\"smoke-test-password-1\",\"name\":\"Smoke\"}" \
	"$api/api/auth/sign-up/email")
[ "$code" = 200 ] || fail "sign-up answered $code: $(cat "$logs/signup.json")"
cookie=$(tr -d '\r' <"$logs/signup.headers" | grep -i '^set-cookie: __Secure-better-auth\.session_token=' || true)
for attribute in "; Domain=$COOKIE_DOMAIN" '; Secure' '; HttpOnly'; do
	grep -qi -- "$attribute" <<<"$cookie" || fail "the session cookie lacks '$attribute': $cookie"
done
# The cookies read back as that user.
jar=$(tr -d '\r' <"$logs/signup.headers" |
	awk 'tolower($1) == "set-cookie:" { sub(/^[^:]*: */, ""); sub(/;.*/, ""); print }' | paste -sd ';' - | sed 's/;/; /g')
curl -fsS -o "$logs/session.json" -H "Cookie: $jar" "$api/api/auth/get-session" || fail "GET /api/auth/get-session with the cookie failed"
jq -e --arg email "$email" '.user.email == $email' "$logs/session.json" >/dev/null ||
	fail "the sign-up's cookies did not read back as its session: $(cat "$logs/session.json")"

# CORS answers WEB_URL, with credentials, and no other origin.
preflight() {
	curl -s -o /dev/null -D - -X OPTIONS -H "Origin: $1" -H 'Access-Control-Request-Method: POST' \
		"$api/api/auth/sign-in/email" | tr -d '\r' | awk 'tolower($1) == "access-control-allow-origin:" { print $2 }'
}
if [ "$(preflight "$WEB_URL")" != "$WEB_URL" ] || [ -n "$(preflight https://evil.example)" ]; then
	fail "CORS did not answer exactly WEB_URL"
fi

# Haloy stops the old container with SIGTERM: it must drain and exit 0.
kill -TERM "$pid"
if ! timeout 15 tail --pid="$pid" -f /dev/null; then
	fail "the API was still running 15 s after SIGTERM"
fi
wait "$pid" || fail "the API exited $? after SIGTERM; it must exit 0"
trap - EXIT
echo "Smoke test passed."
