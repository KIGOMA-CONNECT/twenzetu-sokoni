FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx nx build api --configuration=production

FROM nginx:alpine AS nginx-config
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

FROM node:20-alpine AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 afri-market && \
    adduser --system --uid 1001 afri-market
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.runner.json ./tsconfig.json
COPY --from=builder /app/tsconfig.runner.json ./tsconfig.runner.json
COPY --from=builder /app/tsconfig.cli.json ./tsconfig.cli.json
RUN npm prune --omit=dev
USER afri-market
EXPOSE 3000
CMD ["node", "-r", "tsconfig-paths/register", "dist/out-tsc/apps/api/src/main.js"]
