# Docker Workflows Overview

This directory contains Docker-related workflows for building, testing, and deploying containerized versions of the Phialo Design application.

## Workflow Files

### Core Workflows

1. **`docker-base-images.yml`**
   - Builds and maintains base Docker images (CI, Dev, Production)
   - Runs weekly or on-demand
   - Handles multi-architecture builds (amd64, arm64)
   - Includes security scanning and SBOM generation

2. **`docker-build-reusable.yml`**
   - Reusable workflow for consistent Docker builds
   - Provides standardized tagging, caching, and security scanning
   - Can be called by other workflows with custom parameters

3. **`ci-containerized-v2.yml`**
   - Main CI/CD pipeline using containerized environments
   - Runs tests in parallel using Docker containers
   - Handles automatic image selection and caching
   - Builds production images on main branch

4. **`docker-example.yml`**
   - Example workflow demonstrating Docker registry usage
   - Shows various patterns for building and using images
   - Includes Docker Compose examples

## Quick Start

### Using Pre-built Images

```yaml
# In your workflow
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/barde/phialoastro-ci:latest
    steps:
      - name: Run tests
        run: pnpm test:run
```

### Building Custom Images

```yaml
# Call the reusable workflow
jobs:
  build:
    uses: ./.github/workflows/docker-build-reusable.yml
    with:
      dockerfile: ./path/to/Dockerfile
      image-name: my-custom-image
      platforms: linux/amd64,linux/arm64
```

## Image Registry

All images are stored in GitHub Container Registry (GHCR):

- **Production**: `ghcr.io/barde/phialoastro:latest`
- **CI/Testing**: `ghcr.io/barde/phialoastro-ci:latest`
- **Development**: `ghcr.io/barde/phialoastro-dev:latest`

## Key Features

### 🚀 Performance
- Multi-layer caching strategy
- Parallel test execution
- Pre-built images for fast CI runs

### 🔒 Security
- Automated vulnerability scanning with Trivy
- SBOM generation for supply chain security
- Minimal production images

### 🏗️ Architecture
- Multi-platform support (amd64, arm64)
- Optimized layer caching
- Modular workflow design

### 🏷️ Versioning
- Multiple tag formats (latest, branch, SHA, date)
- Semantic versioning support
- Reproducible builds with SHA tags

## Common Tasks

### Running Tests Locally with Docker

```bash
# Pull the CI image
docker pull ghcr.io/barde/phialoastro-ci:latest

# Run tests
docker run --rm ghcr.io/barde/phialoastro-ci:latest pnpm test:run

# Run with local code
docker run --rm -v $(pwd):/app ghcr.io/barde/phialoastro-ci:latest pnpm test:run
```

### Building Images Locally

```bash
# Build with BuildKit
DOCKER_BUILDKIT=1 docker build -f phialo-design/Dockerfile.ci -t test-image phialo-design/

# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 -f phialo-design/Dockerfile.ci phialo-design/
```

### Debugging Failed Builds

1. Check the workflow logs in GitHub Actions
2. Run the build locally with `--progress=plain`
3. Inspect failed layers with `docker history`
4. Use `dive` tool for detailed image analysis

## Permissions Required

Workflows need these permissions:

```yaml
permissions:
  contents: read      # Read repository content
  packages: write     # Push to GHCR
  security-events: write  # Upload security scan results
```

## Best Practices

1. **Always use specific tags in production** - Never use `latest` in production deployments
2. **Leverage caching** - Use the multi-layer cache strategy for faster builds
3. **Keep images small** - Use multi-stage builds and Alpine base images
4. **Scan for vulnerabilities** - Enable security scanning for all production images
5. **Document changes** - Update image documentation when making significant changes

## Troubleshooting

### Common Issues

1. **Build failures**: Check Dockerfile syntax and ensure all files are present
2. **Permission denied**: Verify workflow has correct permissions
3. **Cache misses**: Ensure cache keys are consistent
4. **Platform errors**: Verify QEMU setup for multi-arch builds

### Getting Help

1. Check workflow logs for detailed error messages
2. Review the [Docker Registry Guide](../../docs/how-to/docker-registry.md)
3. Test builds locally before pushing
4. Use the example workflow for reference

## Future Improvements

- [ ] Implement image signing with cosign
- [ ] Add automated base image updates
- [ ] Implement size budgets for images
- [ ] Add performance benchmarking
- [ ] Create development CLI tools