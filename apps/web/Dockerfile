# Build stage with turbo
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN npm install -g turbo

# Copy entire monorepo
COPY . .

# Generate a partial monorepo with only the files needed for web
RUN turbo prune omnifocus-web --docker

# Install stage
FROM node:20-alpine AS installer

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy pruned lockfile and package.json files
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json 2>/dev/null || true

# Install dependencies
RUN npm install

# Copy pruned source code
COPY --from=builder /app/out/full/ .

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the application
RUN npm run build --filter=omnifocus-web

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer /app/apps/web/public ./apps/web/public

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
