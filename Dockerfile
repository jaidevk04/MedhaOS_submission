# Base image for Node.js applications
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY turbo.json ./

# Install dependencies
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 medhaos

# Copy built application
COPY --from=builder --chown=medhaos:nodejs /app/dist ./dist
COPY --from=builder --chown=medhaos:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=medhaos:nodejs /app/package.json ./package.json

USER medhaos

EXPOSE 3000

CMD ["node", "dist/index.js"]
