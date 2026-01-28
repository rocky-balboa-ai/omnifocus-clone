FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Build NestJS app
RUN npm run build

EXPOSE 3000

# Run production build
CMD ["npm", "run", "start:prod"]
