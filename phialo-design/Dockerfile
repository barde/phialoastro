# Multi-stage production Dockerfile with optimal caching
# Supports both amd64 and arm64 architectures

# Stage 1: Base image with pnpm
FROM node:20-alpine AS base

# Install pnpm with specific version
RUN corepack enable && \
    corepack prepare pnpm@9.15.2 --activate && \
    pnpm config set store-dir /pnpm-store

# Stage 2: Dependencies installer
FROM base AS deps

WORKDIR /app

# Copy package files only
COPY package.json pnpm-lock.yaml ./

# Install production dependencies with caching
RUN --mount=type=cache,id=pnpm,target=/pnpm-store \
    pnpm install --frozen-lockfile --prod --prefer-offline

# Stage 3: Build dependencies installer
FROM base AS build-deps

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies) for building
RUN --mount=type=cache,id=pnpm,target=/pnpm-store \
    pnpm install --frozen-lockfile --prefer-offline

# Stage 4: Builder
FROM build-deps AS builder

# Set build-time environment variables
ENV NODE_ENV=production \
    ASTRO_TELEMETRY_DISABLED=1

# Copy configuration files first (for better caching)
COPY astro.config.mjs \
     tailwind.config.mjs \
     tsconfig.json \
     vite.config.ts \
     ./

# Copy source files
COPY public ./public
COPY src ./src

# Build the application with optimizations
RUN pnpm run build && \
    # Remove source maps in production
    find dist -name "*.map" -delete && \
    # Clean up unnecessary files
    rm -rf src tests .astro node_modules/.cache

# Stage 5: Production runner (minimal image)
FROM node:20-alpine AS runner

# Install only runtime dependencies
RUN apk add --no-cache \
    # Required for some npm packages at runtime
    libc6-compat && \
    # Create non-root user for security
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application and production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4321', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start command using node directly (faster than npm)
CMD ["node", "./dist/server/entry.mjs"]

# Stage 6: Static export (for CDN deployment)
FROM scratch AS static

# Copy only the static files
COPY --from=builder /app/dist /

# This stage outputs just the static files for CDN deployment