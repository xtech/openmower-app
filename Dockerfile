FROM node:24-alpine AS base
USER node
WORKDIR /app

###############################################################################

FROM base AS builder

USER root
RUN corepack enable
USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .
RUN pnpm run build

###############################################################################

FROM base AS runner

COPY --chown=node:node --from=builder /app/.next/standalone  ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static
COPY --chown=node:node --from=builder /app/public ./public

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "server.js"]
