# Multi-stage CI/CD optimized Dockerfile with maximum layer caching
# Supports both amd64 and arm64 architectures

# Stage 1: Base dependencies layer (rarely changes)
FROM node:20-alpine AS base-deps

# Install system dependencies in a single layer
# These are needed for native modules, Playwright, and build tools
RUN apk add --no-cache \
    # Build tools
    git \
    python3 \
    make \
    g++ \
    # Required for some npm packages
    libc6-compat \
    # Browsers and their dependencies
    chromium \
    firefox-esr \
    # Chromium dependencies
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    # Firefox dependencies
    dbus-x11 \
    # Utilities
    bash \
    curl \
    # Required for wait-on
    netcat-openbsd

# Install pnpm globally with specific version for consistency
RUN corepack enable && \
    corepack prepare pnpm@9.15.2 --activate && \
    pnpm config set store-dir /pnpm-store

# Stage 2: Dependencies installation (changes when package files change)
FROM base-deps AS deps

WORKDIR /app

# Copy only package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install dependencies with optimal caching
# Use CI mode to skip pre/post install scripts and speed up installation
RUN --mount=type=cache,id=pnpm,target=/pnpm-store \
    pnpm install --frozen-lockfile --prefer-offline && \
    # Install Playwright browsers properly
    npx playwright install chromium firefox webkit && \
    # Clear npm cache to reduce image size
    npm cache clean --force

# Stage 3: Build preparation (changes when config files change)
FROM deps AS build-prep

# Copy all configuration files
COPY astro.config.mjs \
     tailwind.config.mjs \
     tsconfig.json \
     vite.config.ts \
     vitest.config.ts \
     playwright.config.ts \
     playwright.*.config.ts \
     lefthook.yml \
     .eslintrc.* \
     .prettierrc* \
     ./

# Copy any additional config files that might exist
COPY .dockerignore* .gitignore* ./

# Stage 4: Full CI image with source code
FROM build-prep AS ci

# Set environment variables for CI
ENV CI=true \
    NODE_ENV=test \
    # Playwright configuration
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    # Disable telemetry
    ASTRO_TELEMETRY_DISABLED=1 \
    # pnpm settings
    PNPM_HOME=/pnpm \
    PATH="$PNPM_HOME:$PATH"

# Copy source code and tests
COPY public ./public
COPY src ./src
COPY tests ./tests
COPY scripts ./scripts

# Pre-compile and cache build artifacts
RUN pnpm run typecheck && \
    pnpm run build && \
    # Pre-run linting to cache eslint
    pnpm run lint || true

# Default command for CI
CMD ["pnpm", "test:run"]

# Stage 5: Minimal test runner (for specific test scenarios)
FROM ci AS test-runner

# Override command for test execution
CMD ["pnpm", "test:e2e:ci"]

# Stage 6: Quality checks runner
FROM ci AS quality

# Run all quality checks
CMD ["/bin/sh", "-c", "pnpm run lint && pnpm run typecheck && pnpm run format:check"]