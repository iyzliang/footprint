FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/server/package.json packages/server/
COPY packages/dashboard/package.json packages/dashboard/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules
COPY --from=deps /app/packages/dashboard/node_modules ./packages/dashboard/node_modules
COPY . .

RUN cd packages/dashboard && npx vite build
RUN cd packages/server && npx nest build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

# Keep workspace-like runtime layout so Node resolves package deps correctly.
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/dashboard/dist ./packages/dashboard/dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/server/node_modules ./packages/server/node_modules
COPY packages/server/package.json ./packages/server/package.json

WORKDIR /app/packages/server

EXPOSE 3008

CMD ["node", "dist/main.js"]
