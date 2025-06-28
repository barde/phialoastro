# Docker Registry Setup Guide

This guide explains the Docker registry setup for the Phialo Design project, using GitHub Container Registry (GHCR) for storing and managing Docker images.

## Overview

The project uses GitHub Container Registry (GHCR) for the following reasons:

1. **Native GitHub Integration**: Seamless integration with GitHub Actions and permissions
2. **Cost-Effective**: Free for public repositories and included in GitHub plans
3. **Security**: Integrated with GitHub's security features including vulnerability scanning
4. **Multi-Architecture Support**: Native support for multi-platform images
5. **Package Visibility**: Can be linked directly to the repository

## Image Types

### 1. CI Image (`ghcr.io/barde/phialoastro-ci`)
- **Purpose**: Optimized for CI/CD with all test dependencies pre-installed
- **Base**: Node 20 Alpine with Chromium, Firefox, and build tools
- **Use Cases**: Running tests, linting, type checking in CI
- **Platforms**: linux/amd64, linux/arm64

### 2. Development Image (`ghcr.io/barde/phialoastro-dev`)
- **Purpose**: Local development environment
- **Base**: Node 20 Alpine with development tools
- **Use Cases**: Local development, debugging
- **Platforms**: linux/amd64, linux/arm64

### 3. Production Image (`ghcr.io/barde/phialoastro`)
- **Purpose**: Production-ready application
- **Base**: Minimal Alpine image with only runtime dependencies
- **Use Cases**: Production deployment
- **Platforms**: linux/amd64, linux/arm64

## Tagging Strategy

### Tag Formats

1. **Latest Tag**: `latest`
   - Applied to images built from the main/master branch
   - Represents the most recent stable version

2. **Branch Tags**: `feature-branch-name`
   - Applied to images built from feature branches
   - Useful for testing branch-specific changes

3. **PR Tags**: `pr-123`
   - Applied to images built for pull requests
   - Enables testing PR changes in isolation

4. **SHA Tags**: `main-abc1234` or `sha-abc1234567890`
   - Short SHA for general use
   - Long SHA for production deployments
   - Enables exact reproduction of builds

5. **Date Tags**: `20240628` or `20240628-143022`
   - Date-based tags for chronological tracking
   - Useful for rollbacks and debugging

6. **Semantic Version Tags**: `v1.2.3`, `1.2`, `1`
   - Applied when using git tags
   - Follows semantic versioning conventions

### Example Tags for a Release

For a release tagged as `v1.2.3` on the main branch:
```
ghcr.io/barde/phialoastro:latest
ghcr.io/barde/phialoastro:v1.2.3
ghcr.io/barde/phialoastro:1.2
ghcr.io/barde/phialoastro:1
ghcr.io/barde/phialoastro:main-abc1234
ghcr.io/barde/phialoastro:sha-abc1234567890
ghcr.io/barde/phialoastro:20240628
```

## Authentication & Permissions

### GitHub Actions

GitHub Actions automatically authenticate using the `GITHUB_TOKEN`:

```yaml
- name: Log in to GitHub Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

Required permissions in workflow:
```yaml
permissions:
  contents: read
  packages: write
  security-events: write  # For vulnerability scanning
```

### Local Development

To push images locally:

1. Create a Personal Access Token (PAT) with `write:packages` scope
2. Login to GHCR:
   ```bash
   echo $PAT | docker login ghcr.io -u USERNAME --password-stdin
   ```

## Caching Strategy

### Build Cache

The workflows use multiple cache layers:

1. **GitHub Actions Cache**: Fast, ephemeral cache
   ```yaml
   cache-from: |
     type=gha,scope=ci-${{ github.ref }}
     type=gha,scope=ci-main
   ```

2. **Registry Cache**: Persistent cache in GHCR
   ```yaml
   cache-to: |
     type=registry,ref=ghcr.io/barde/phialoastro:buildcache
   ```

3. **Inline Cache**: BuildKit inline cache for layer reuse
   ```yaml
   build-args: |
     BUILDKIT_INLINE_CACHE=1
   ```

### Cache Hierarchy

1. Check current branch cache
2. Fall back to main branch cache
3. Use registry cache as last resort
4. Build from scratch if no cache available

## Security Features

### 1. Vulnerability Scanning

All images are scanned using Trivy:
- Scans for CRITICAL and HIGH vulnerabilities
- Results uploaded to GitHub Security tab
- Non-blocking (doesn't fail builds)

### 2. SBOM Generation

Software Bill of Materials (SBOM) generated for production images:
- SPDX format
- Stored as artifacts
- Enables supply chain security

### 3. Image Signing

Images include provenance attestations:
- Build provenance for transparency
- SBOM attestations for security

## Workflows

### 1. Base Image Workflow (`docker-base-images.yml`)

Builds and maintains base images:
- Triggered manually or on schedule (weekly)
- Rebuilds when Dockerfiles change
- Handles multi-architecture builds

### 2. Reusable Build Workflow (`docker-build-reusable.yml`)

Provides consistent build process:
- Standardized tagging
- Security scanning
- Multi-platform support
- Can be called by other workflows

### 3. CI Containerized Workflow (`ci-containerized-v2.yml`)

Runs CI/CD pipeline in containers:
- Parallel test execution
- E2E testing with browsers
- Automatic image selection
- Production builds on main branch

## Usage Examples

### Running Tests Locally

```bash
# Pull the CI image
docker pull ghcr.io/barde/phialoastro-ci:latest

# Run unit tests
docker run --rm ghcr.io/barde/phialoastro-ci:latest pnpm test:run

# Run with local code mounted
docker run --rm -v $(pwd):/app ghcr.io/barde/phialoastro-ci:latest pnpm test:run
```

### Building Images Locally

```bash
# Build CI image
docker build -f phialo-design/Dockerfile.ci -t my-ci-image phialo-design/

# Build with BuildKit for better caching
DOCKER_BUILDKIT=1 docker build -f phialo-design/Dockerfile.ci -t my-ci-image phialo-design/
```

### Using in GitHub Actions

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/barde/phialoastro-ci:latest
    steps:
      - name: Run tests
        run: pnpm test:run
```

## Maintenance

### Cleaning Up Old Images

The workflow automatically cleans up:
- Untagged images
- Keeps minimum 5 versions
- Runs after successful builds

Manual cleanup:
```bash
# List all versions
gh api /user/packages/container/phialoastro/versions

# Delete specific version
gh api --method DELETE /user/packages/container/phialoastro/versions/VERSION_ID
```

### Monitoring Image Sizes

```bash
# Check image size
docker images ghcr.io/barde/phialoastro*

# Inspect image layers
docker history ghcr.io/barde/phialoastro:latest

# Analyze with dive
dive ghcr.io/barde/phialoastro:latest
```

## Best Practices

1. **Layer Optimization**
   - Order Dockerfile commands from least to most frequently changing
   - Combine RUN commands where appropriate
   - Clean up package manager cache

2. **Security**
   - Regularly rebuild base images for security updates
   - Use specific version tags in production
   - Never store secrets in images

3. **Performance**
   - Use multi-stage builds
   - Minimize final image size
   - Leverage build cache effectively

4. **Versioning**
   - Use semantic versioning for releases
   - Tag with multiple identifiers for flexibility
   - Document breaking changes

## Troubleshooting

### Build Failures

1. Check GitHub Actions logs
2. Verify Dockerfile syntax
3. Check for rate limiting
4. Ensure proper permissions

### Cache Issues

```bash
# Force rebuild without cache
docker build --no-cache -f Dockerfile .

# Clear GitHub Actions cache
# Use workflow dispatch with force-rebuild option
```

### Permission Denied

Ensure workflow has proper permissions:
```yaml
permissions:
  contents: read
  packages: write
```

### Multi-Architecture Issues

1. Ensure QEMU is set up
2. Check platform compatibility
3. Test builds locally with buildx

## Migration from Docker Hub

If migrating from Docker Hub:

1. **Update image references**: Change from `docker.io/user/image` to `ghcr.io/user/image`
2. **Update CI/CD**: Change login credentials and registry URL
3. **Migrate tags**: Pull from Docker Hub, retag, push to GHCR
4. **Update documentation**: Ensure all references point to new registry

## Future Enhancements

1. **Image Signing**: Implement cosign for cryptographic signatures
2. **Policy Enforcement**: Use OPA for security policies
3. **Automated Updates**: Dependabot for base image updates
4. **Performance Metrics**: Track build times and image sizes
5. **Cost Optimization**: Implement retention policies