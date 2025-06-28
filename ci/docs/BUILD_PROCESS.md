# CI Base Image Build Process

This document details the build process for the Phialo CI base Docker image.

## Overview

The base CI image is designed to be:
- **Small**: ~230MB total size using Alpine Linux
- **Fast**: Optimized layer caching for quick rebuilds
- **Secure**: Non-root user, minimal attack surface
- **Complete**: All tools needed for Node.js CI/CD

## Build Stages

### Stage 1: Base System
```dockerfile
FROM node:20-alpine AS base
```
- Starts with official Node.js 20 Alpine image
- Alpine Linux provides small size and security
- Includes npm and basic Node.js tooling

### Stage 2: System Dependencies
```dockerfile
RUN apk add --no-cache \
    git python3 make g++ libc6-compat \
    bash curl netcat-openbsd
```
- **git**: Version control operations
- **python3, make, g++**: Build tools for native modules
- **libc6-compat**: Compatibility layer for glibc
- **bash**: Better shell scripting support
- **curl**: HTTP operations
- **netcat-openbsd**: Network diagnostics

### Stage 3: pnpm Setup
```dockerfile
RUN corepack enable && \
    corepack prepare pnpm@9.15.2 --activate
```
- Uses corepack for consistent pnpm versions
- Configures pnpm for optimal CI performance
- Sets up centralized store directory

### Stage 4: Environment Configuration
- Sets CI-specific environment variables
- Disables telemetry for various tools
- Configures color output for better logs

### Stage 5: Security Setup
- Creates non-root user (nodejs:1001)
- Sets appropriate permissions
- Switches to non-root user by default

## Layer Optimization

### Techniques Used

1. **Combine RUN commands**
   - Reduces layer count
   - Single layer for all system packages

2. **Clean package manager cache**
   ```dockerfile
   rm -rf /var/cache/apk/*
   ```

3. **Order by change frequency**
   - System packages (rarely change) first
   - Configuration last

4. **Use specific versions**
   - Prevents unexpected updates
   - Ensures reproducible builds

## Build Arguments

The build process supports:
- `BUILDKIT_INLINE_CACHE=1`: Enable inline cache metadata
- Custom tags for versioning

## Build Commands

### Standard Build
```bash
docker build -f Dockerfile.base -t phialo-ci-base:latest .
```

### With BuildKit (Recommended)
```bash
DOCKER_BUILDKIT=1 docker build \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -f Dockerfile.base \
  -t phialo-ci-base:latest .
```

### Multi-architecture Build
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile.base \
  -t phialo-ci-base:latest .
```

## Caching Strategy

### Local Development
- Docker layer cache
- pnpm store volume mount
- BuildKit inline cache

### CI/CD Pipeline
- GitHub Actions cache
- Registry-based caching
- Layer reuse across builds

## Size Analysis

```
Base Alpine Node image:     ~180MB
System dependencies:        ~40MB
pnpm installation:          ~10MB
Configuration & setup:      ~1MB
---------------------------------
Total:                      ~231MB
```

Compare to Ubuntu-based:    ~1.2GB

## Security Considerations

1. **Minimal base image**
   - Alpine Linux has smaller attack surface
   - Only essential packages installed

2. **Non-root execution**
   - Container runs as user 1001
   - Root only used during build

3. **No unnecessary tools**
   - No compilers in production images
   - No debugging tools by default

4. **Regular updates**
   - Base image updated weekly
   - Security patches applied promptly

## Troubleshooting

### Build Failures

1. **Network issues**
   ```bash
   docker build --network=host ...
   ```

2. **Cache corruption**
   ```bash
   docker builder prune -a
   ```

3. **Platform issues**
   ```bash
   docker buildx create --use
   ```

### Performance Issues

1. **Enable BuildKit**
   ```bash
   export DOCKER_BUILDKIT=1
   ```

2. **Use cache mounts**
   ```dockerfile
   RUN --mount=type=cache,target=/pnpm-store \
       pnpm install
   ```

3. **Parallel builds**
   ```bash
   docker buildx build --parallel ...
   ```

## Best Practices

1. **Always tag images**
   - Use semantic versioning
   - Tag with git commit SHA

2. **Test after building**
   - Run test script
   - Verify all tools work

3. **Document changes**
   - Update README
   - Note breaking changes

4. **Monitor size**
   - Check image size regularly
   - Investigate size increases

## Maintenance Schedule

- **Weekly**: Update base Node.js image
- **Monthly**: Update system packages
- **Quarterly**: Review and optimize layers
- **Yearly**: Major version upgrades

## Metrics and Monitoring

Track these metrics:
- Build time
- Image size
- Layer count
- Cache hit rate
- CVE count

## Future Improvements

1. **Distroless variant**
   - Even smaller size
   - Better security

2. **Multi-stage optimization**
   - Separate build/runtime tools
   - Conditional layers

3. **Architecture-specific builds**
   - Optimized for ARM64
   - Native M1/M2 support

4. **Automated updates**
   - Dependabot for base image
   - Automated security patches