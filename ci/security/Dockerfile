# Security Scanner Image for Phialo Design
# Extends the base CI image with security scanning tools
# Includes dependency scanners, SAST tools, and container scanners

ARG BASE_IMAGE=ghcr.io/barde/phialo-ci-base:latest
FROM ${BASE_IMAGE}

# Switch to root for tool installations
USER root

# Install security scanning tools
RUN apk add --no-cache \
    # System utilities
    curl \
    git \
    python3 \
    py3-pip \
    # Java for OWASP Dependency Check
    openjdk11-jre \
    # Build tools for native dependencies
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev \
    python3-dev \
    # Additional security tools
    gnupg \
    openssh-client

# Install Trivy for container scanning
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin v0.48.0

# Install TruffleHog for secret scanning
RUN curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin v3.63.0

# Install Semgrep for SAST
RUN python3 -m pip install --no-cache-dir semgrep==1.45.0

# Install OWASP Dependency Check
ENV DC_VERSION=9.0.7
RUN mkdir -p /opt/dependency-check && \
    curl -L "https://github.com/jeremylong/DependencyCheck/releases/download/v${DC_VERSION}/dependency-check-${DC_VERSION}-release.zip" \
    -o /tmp/dependency-check.zip && \
    unzip /tmp/dependency-check.zip -d /opt/dependency-check && \
    rm /tmp/dependency-check.zip && \
    chmod +x /opt/dependency-check/dependency-check/bin/dependency-check.sh && \
    ln -s /opt/dependency-check/dependency-check/bin/dependency-check.sh /usr/local/bin/dependency-check

# Install Snyk CLI (optional, requires auth token)
RUN npm install -g snyk@latest

# Install additional Node.js security tools
RUN npm install -g \
    # Node Security Platform (now part of npm audit)
    better-npm-audit@3.7.3 \
    # License checker
    license-checker@25.0.1 \
    # Outdated dependency checker
    npm-check-updates@16.14.12

# Create directories for reports
RUN mkdir -p /security-reports && \
    chmod 755 /security-reports

# Switch back to node user
USER node

# Set working directory
WORKDIR /app

# Environment variables for security tools
ENV DEPENDENCY_CHECK_DATA=/tmp/dependency-check-data \
    SEMGREP_APP_TOKEN="" \
    SNYK_TOKEN="" \
    TRIVY_CACHE_DIR=/tmp/trivy-cache \
    # Disable telemetry for privacy
    SEMGREP_SEND_METRICS=off \
    SNYK_DISABLE_ANALYTICS=1

# Create cache directories
RUN mkdir -p $DEPENDENCY_CHECK_DATA $TRIVY_CACHE_DIR && \
    chmod -R 755 $DEPENDENCY_CHECK_DATA $TRIVY_CACHE_DIR

# Add security scanning scripts
COPY --chown=node:node scripts/security-scan.sh /usr/local/bin/security-scan
RUN chmod +x /usr/local/bin/security-scan

# Default command runs all security scans
CMD ["/usr/local/bin/security-scan"]