# Playwright Test Runner Image for Phialo Design
# Extends the base CI image with Playwright and browser dependencies
# Supports all three browsers: Chromium, Firefox, and WebKit

ARG BASE_IMAGE=ghcr.io/barde/phialo-ci-base:latest
FROM ${BASE_IMAGE}

# Switch to root for system installations
USER root

# Install system dependencies for browsers
# These are required for Playwright browsers to run properly
RUN apk add --no-cache \
    # Chromium dependencies
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    # Firefox dependencies
    firefox-esr \
    # WebKit/Safari dependencies
    webkit2gtk \
    # X11 and display dependencies for headless testing
    xvfb \
    dbus \
    dbus-x11 \
    # Additional utilities
    mesa-gl \
    mesa-dri-gallium \
    # Font packages for better rendering
    font-noto \
    font-noto-cjk \
    font-noto-emoji \
    # Video codecs for video recording
    ffmpeg \
    # Process management
    dumb-init

# Set up Xvfb for headless display
ENV DISPLAY=:99

# Create directory for Playwright browsers with correct permissions
RUN mkdir -p /ms-playwright && \
    chown -R node:node /ms-playwright

# Switch back to node user
USER node

# Set Playwright environment variables
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0 \
    # Force headless mode in CI
    PLAYWRIGHT_CHROMIUM_USE_HEADLESS_NEW=1 \
    # Improve browser stability
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true

# Create test workspace
WORKDIR /app

# Copy package files as node user
COPY --chown=node:node package.json pnpm-lock.yaml ./

# Install dependencies and Playwright browsers
RUN pnpm install --frozen-lockfile && \
    # Install Playwright with all browsers
    pnpm exec playwright install --with-deps chromium firefox webkit && \
    # Verify installation
    pnpm exec playwright --version && \
    # Clean up
    pnpm store prune

# Copy Playwright configurations
COPY --chown=node:node playwright*.config.ts ./

# Copy test files
COPY --chown=node:node tests ./tests

# Create directories for test artifacts
RUN mkdir -p test-results playwright-report && \
    chmod -R 755 test-results playwright-report

# Add healthcheck to verify Playwright is ready
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD pnpm exec playwright --version || exit 1

# Default entrypoint with dumb-init for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Default command runs E2E tests in CI mode
CMD ["pnpm", "run", "test:e2e:ci"]