ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

FROM base AS build

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY drizzle ./drizzle

RUN pnpm build

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm prune --prod --ignore-scripts

FROM node:${NODE_VERSION}-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist         ./dist
COPY --from=build --chown=node:node /app/drizzle      ./drizzle
COPY --from=build --chown=node:node /app/package.json ./package.json

USER node

ENTRYPOINT ["node", "dist/index.js"]
