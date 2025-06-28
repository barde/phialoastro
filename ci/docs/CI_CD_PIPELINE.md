# Docker CI/CD Pipeline Documentation

## Overview

The Phialo Design project uses a comprehensive Docker-based CI/CD pipeline that automatically builds, tests, and manages container images. This pipeline ensures that our development and deployment environments remain secure, up-to-date, and consistent across all stages.

## Architecture

### Image Hierarchy

```
phialo-ci-base (Node.js 20 + pnpm)
├── phialo-test (Playwright + browsers)
└── phialo-build-deploy (Cloudflare Wrangler + build tools)
```

### GitHub Container Registry

All images are published to GitHub Container Registry (ghcr.io):
- `ghcr.io/[owner]/phialo-ci-base`
- `ghcr.io/[owner]/phialo-test`
- `ghcr.io/[owner]/phialo-build-deploy`

## Workflows

### 1. Main CI/CD Pipeline (`docker-images.yml`)

**Triggers:**
- Push to main/master branches
- Pull requests with CI-related changes
- Weekly schedule (Sunday 2 AM UTC)
- Manual dispatch

**Features:**
- Multi-architecture builds (amd64, arm64)
- Smart caching with GitHub Actions cache
- Security scanning with Trivy
- Automatic tagging and versioning
- Release creation on main branch

**Jobs:**
1. **changes**: Detects which images need rebuilding
2. **build-base**: Builds the base CI image
3. **build-test**: Builds the Playwright test image
4. **build-deploy**: Builds the deployment image
5. **test-images**: Runs functional tests on built images
6. **cleanup**: Removes old untagged versions
7. **release**: Creates GitHub releases for main branch builds

### 2. PR-Specific Builds (`docker-pr-builds.yml`)

**Triggers:**
- Pull request events (opened, synchronize, reopened)

**Features:**
- Builds PR-specific images with unique tags
- Comments on PR with image details
- Runs basic smoke tests
- Automatic cleanup when PR is closed

**Image Tags:**
- Format: `pr-{number}-{image-name}`
- Example: `ghcr.io/owner/phialo-ci-base:pr-123-ci-base`

### 3. Security Updates (`docker-security-updates.yml`)

**Triggers:**
- Daily at 3 AM UTC
- Manual dispatch with severity threshold

**Features:**
- Scans all images for vulnerabilities
- Automatic rebuild if vulnerabilities found
- Creates GitHub issues for tracking
- Configurable severity thresholds
- SARIF report upload to Security tab

**Process:**
1. Scan all images with Trivy
2. Check vulnerability counts against threshold
3. Trigger rebuild if needed
4. Create issue with results

### 4. Image Cleanup (`docker-cleanup.yml`)

**Triggers:**
- Weekly on Sunday at 4 AM UTC
- Manual dispatch with parameters

**Features:**
- Configurable retention policies
- Dry run mode for safety
- Keeps tagged versions
- Respects minimum version count
- Generates cleanup reports

**Parameters:**
- `dry_run`: Show what would be deleted without doing it
- `keep_days`: Keep images newer than X days (default: 30)
- `keep_versions`: Minimum versions to keep (default: 5)

## Image Details

### Base CI Image (`phialo-ci-base`)

**Contents:**
- Node.js 20 Alpine Linux
- pnpm package manager
- Git, Python3, Make, G++
- Non-root user setup

**Size:** ~230MB

**Use Cases:**
- Base for other images
- Simple Node.js tasks
- Linting and type checking

### Test Image (`phialo-test`)

**Contents:**
- Extends base image
- Playwright with all browsers
- Xvfb for headless operation
- FFmpeg for video recording
- dumb-init for signal handling

**Size:** ~800MB

**Use Cases:**
- E2E testing
- Visual regression testing
- Cross-browser testing

### Build/Deploy Image (`phialo-build-deploy`)

**Contents:**
- Node.js 22 Alpine
- Cloudflare Wrangler
- Image optimization tools
- Build scripts

**Size:** ~500MB

**Use Cases:**
- Production builds
- Deployment to Cloudflare
- Bundle optimization

## Security

### Scanning

All images are scanned for vulnerabilities using Trivy:
- On every build
- Daily scheduled scans
- Results uploaded to GitHub Security tab
- Automatic rebuild on HIGH/CRITICAL vulnerabilities

### Best Practices

1. **Non-root users**: All images use non-root users
2. **Minimal base images**: Alpine Linux for small attack surface
3. **No secrets in images**: All credentials passed at runtime
4. **Regular updates**: Weekly rebuilds for security patches
5. **Version pinning**: Explicit versions for reproducibility

## Usage

### Pull Images

```bash
# Latest versions
docker pull ghcr.io/owner/phialo-ci-base:latest
docker pull ghcr.io/owner/phialo-test:latest
docker pull ghcr.io/owner/phialo-build-deploy:latest

# Specific version
docker pull ghcr.io/owner/phialo-ci-base:2024.01.15.123

# PR-specific version
docker pull ghcr.io/owner/phialo-ci-base:pr-456-ci-base
```

### Run Tests

```bash
# Run E2E tests
docker run --rm \
  -v $(pwd):/workspace \
  ghcr.io/owner/phialo-test:latest \
  pnpm test:e2e

# Run with specific configuration
docker run --rm \
  -v $(pwd):/workspace \
  -e PLAYWRIGHT_BROWSERS=chromium \
  ghcr.io/owner/phialo-test:latest \
  pnpm test:e2e -- --project=chromium
```

### Build and Deploy

```bash
# Build for production
docker run --rm \
  -v $(pwd):/workspace \
  ghcr.io/owner/phialo-build-deploy:latest \
  /scripts/build.sh

# Deploy to Cloudflare
docker run --rm \
  -e CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN \
  -e CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
  -v $(pwd):/workspace \
  ghcr.io/owner/phialo-build-deploy:latest \
  /scripts/deploy.sh
```

## Maintenance

### Manual Tasks

1. **Review security issues**: Check GitHub issues labeled "security"
2. **Update base images**: Periodically update Node.js versions
3. **Clean registry**: Run cleanup workflow monthly
4. **Monitor size**: Track image size growth over time

### Monitoring

- **Build failures**: Check Actions tab for failed workflows
- **Security alerts**: Monitor Security tab for vulnerabilities
- **Storage usage**: Review Packages section in repository
- **Performance**: Track build times in workflow logs

## Troubleshooting

### Common Issues

1. **Build failures**
   ```bash
   # Check workflow logs
   gh run list --workflow=docker-images.yml
   gh run view <run-id>
   ```

2. **Permission errors**
   ```bash
   # Ensure GITHUB_TOKEN has packages:write permission
   # Check repository settings > Actions > Workflow permissions
   ```

3. **Cache issues**
   ```bash
   # Clear GitHub Actions cache
   gh cache list
   gh cache delete <cache-id>
   ```

4. **Registry login failures**
   ```bash
   # Test authentication locally
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

### Debug Mode

Enable debug logging in workflows:
```yaml
env:
  ACTIONS_RUNNER_DEBUG: true
  ACTIONS_STEP_DEBUG: true
```

## Contributing

### Adding a New Image

1. Create Dockerfile in appropriate directory
2. Add build arguments for metadata
3. Include OCI labels
4. Update workflow matrix
5. Add documentation

### Updating Workflows

1. Test changes in a branch
2. Use workflow dispatch for testing
3. Monitor PR builds
4. Update documentation

## Best Practices

1. **Layer Caching**: Order Dockerfile commands from least to most frequently changing
2. **Multi-stage Builds**: Use stages to reduce final image size
3. **Build Arguments**: Use ARGs for flexibility
4. **Health Checks**: Include HEALTHCHECK instructions
5. **Documentation**: Keep README files in each image directory

## Future Enhancements

1. **Sigstore Integration**: Sign images for supply chain security
2. **SBOM Generation**: Include Software Bill of Materials
3. **Performance Metrics**: Track and optimize build times
4. **Cost Monitoring**: Track GitHub Actions usage
5. **Multi-registry Support**: Push to Docker Hub as backup