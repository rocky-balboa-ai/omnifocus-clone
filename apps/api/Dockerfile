# Build stage with turbo
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma and turbo dependencies
RUN apk add --no-cache openssl openssl-dev libc6-compat
RUN npm install -g turbo

# Copy entire monorepo
COPY . .

# Generate a partial monorepo with only the files needed for the api
RUN turbo prune omnifocus-api --docker

# Install stage
FROM node:20-alpine AS installer

WORKDIR /app

RUN apk add --no-cache openssl openssl-dev libc6-compat

# Copy pruned lockfile and package.json files
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json 2>/dev/null || true

# Install dependencies
RUN npm install

# Copy pruned source code
COPY --from=builder /app/out/full/ .

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build the application
RUN npm run build --filter=omnifocus-api

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy necessary files
COPY --from=installer /app/apps/api/dist ./dist
COPY --from=installer /app/apps/api/node_modules ./node_modules
COPY --from=installer /app/apps/api/package.json ./
COPY --from=installer /app/apps/api/prisma ./prisma
COPY --from=installer /app/node_modules/.prisma ./node_modules/.prisma

USER nestjs

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start:prod"]
