# Build/Deploy Image for Phialo Design
# This image handles the complete build and deployment pipeline to Cloudflare Workers

# Build arguments
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    bash \
    curl \
    libc6-compat \
    python3 \
    make \
    g++ \
    # Image optimization dependencies
    libpng-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    libavif-dev \
    # Build tools
    gcc \
    musl-dev \
    # For better shell experience
    zsh \
    # For deployment status checks
    jq

# Install pnpm globally for faster installs
RUN npm install -g pnpm@9.12.3

# Install Cloudflare Wrangler globally
RUN npm install -g wrangler@4.20.5

# Install image optimization tools
RUN npm install -g \
    sharp-cli@5.1.0 \
    imagemin-cli@8.0.0 \
    svgo@3.3.2

# Create workspace directory
WORKDIR /workspace

# Copy package files for dependency caching
COPY phialo-design/package.json phialo-design/pnpm-lock.yaml ./phialo-design/
COPY workers/package.json workers/pnpm-lock.yaml* ./workers/

# Install dependencies using cache mount
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    cd phialo-design && pnpm install --frozen-lockfile && \
    cd ../workers && pnpm install --frozen-lockfile || true

# Set environment variables for build optimization
ENV NODE_ENV=production
ENV ASTRO_TELEMETRY_DISABLED=1

# Copy the rest of the application
COPY phialo-design ./phialo-design
COPY workers ./workers

# Create deployment scripts directory
RUN mkdir -p /scripts

# Copy deployment scripts
COPY ci/build/scripts/*.sh /scripts/
RUN chmod +x /scripts/*.sh

# Default command shows available commands
CMD ["/scripts/help.sh"]

# Labels
LABEL maintainer="Phialo Design CI" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.authors="Phialo Design Team" \
      org.opencontainers.image.url="https://github.com/phialo/phialoastro" \
      org.opencontainers.image.documentation="https://github.com/phialo/phialoastro/tree/main/ci/build" \
      org.opencontainers.image.source="https://github.com/phialo/phialoastro" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Phialo Design" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.title="Phialo Build/Deploy Image" \
      org.opencontainers.image.description="Build and deployment image for Cloudflare Workers"