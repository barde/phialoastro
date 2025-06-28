# Playwright Test Runner Image for Phialo Design
# Extends the base CI image with Playwright and browser dependencies
# Supports all three browsers: Chromium, Firefox, and WebKit

# Use Debian-based image for Playwright compatibility
FROM node:20-bookworm-slim

# Switch to root for system installations
USER root

# Install system dependencies for browsers
# These are required for Playwright browsers to run properly
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Basic tools
    curl \
    git \
    wget \
    # Build tools
    python3 \
    make \
    g++ \
    # X11 and display dependencies for headless testing
    xvfb \
    # Process management
    dumb-init \
    # Clean up
    && rm -rf /var/lib/apt/lists/*

# Set up Xvfb for headless display
ENV DISPLAY=:99

# Install pnpm
RUN npm install -g pnpm@9.15.2

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

# Install Playwright globally instead of from package
RUN npm install -g playwright@1.53.1 && \
    # Install Playwright with all browsers
    playwright install --with-deps chromium firefox webkit && \
    # Verify installation
    playwright --version

# Skip copying Playwright configurations - they'll be in the mounted workspace

# Skip copying test files - they'll be in the mounted workspace

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