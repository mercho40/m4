# syntax=docker/dockerfile:1

# Build context is the REPO ROOT, not apps/back — a Bun workspace install needs
# the root manifest and lockfile:
#
#   docker build -f apps/back/Dockerfile -t m4-back .
#
# Pinned to the same Bun the repo declares in packageManager, so the image and
# local builds agree.
FROM oven/bun:1.4.2 AS build

WORKDIR /app

# Manifests first, so the dependency layer is cached independently of source
# changes. Every workspace manifest is needed for Bun to resolve the lockfile.
COPY package.json bun.lock ./
COPY apps/back/package.json apps/back/
COPY apps/web/package.json apps/web/

RUN bun install --frozen-lockfile

COPY apps/back/ apps/back/

ENV NODE_ENV=production

# Mirrors the `build` script in apps/back/package.json rather than restating the
# flags, so the two cannot drift.
RUN cd apps/back && bun run build

# `bun build --compile` emits a self-contained executable, so the runtime image
# needs no Bun and no node_modules — only glibc, which distroless/base provides.
FROM gcr.io/distroless/base-debian12 AS runtime

WORKDIR /app

COPY --from=build /app/apps/back/server ./server

ENV NODE_ENV=production
# src/index.ts reads PORT and falls back to 3000. 8080 matches Haloy's default.
ENV PORT=8080

EXPOSE 8080

# Required at runtime, validated at import by src/lib/env.ts — the container
# exits immediately if any is missing, rather than starting misconfigured:
#   DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, WEB_URL
# Optional: GITHUB_CLIENT_ID/SECRET, GOOGLE_CLIENT_ID/SECRET (each provider is
# registered only when both of its values are present).

# GET /health returns {status,timestamp} — point haloy.yaml health_check_path here.
CMD ["./server"]
