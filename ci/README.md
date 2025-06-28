# Phialo Design CI Docker Infrastructure

This directory contains the Docker-based CI infrastructure for the Phialo Design project. The setup is optimized for build speed, caching efficiency, and minimal image size.

## 🎯 CI/CD Pipeline

The project uses GitHub Actions for automated Docker image building, testing, and deployment:

- **Automated Builds**: On push to main, PRs, and weekly schedule
- **Security Scanning**: Daily vulnerability checks with auto-rebuild
- **Multi-Architecture**: Supports amd64 and arm64
- **Registry Management**: Automatic cleanup of old images

See [CI/CD Pipeline Documentation](./docs/CI_CD_PIPELINE.md) for details.

## 📁 Directory Structure

```
ci/
├── base/                 # Base CI image definitions
│   ├── Dockerfile.base   # Optimized base image with Node.js 20 and pnpm
│   └── Dockerfile        # Full CI image (from Phase 1)
├── scripts/              # Build and test scripts
│   ├── build-base.sh     # Build the base CI image
│   └── test-base.sh      # Test the base CI image
├── configs/              # CI configuration files
├── docker-compose.yml    # Docker Compose for local testing
├── Makefile              # Convenient command shortcuts
└── README.md            # This file
```

## 🚀 Quick Start

### Build the Base Image
```bash
cd ci
make build
```

### Test the Base Image
```bash
make test
```

### Open Interactive Shell
```bash
make shell
```

## 🐳 Base CI Image

The base CI image (`phialo-ci-base`) provides:

### Core Components
- **Node.js 20.x** (Alpine-based for smaller size)
- **pnpm 9.15.2** (with optimized caching configuration)
- **Git** (for version control operations)
- **Python3, make, g++** (for building native modules)
- **Basic utilities** (bash, curl, netcat)

### Optimizations
- **Multi-stage builds** for smaller final images
- **Layer caching** optimized for CI workflows
- **Non-root user** for security
- **Health checks** for container orchestration
- **Environment variables** pre-configured for CI

### Image Details
- Base: `node:20-alpine` (~180MB)
- Additional tools: ~50MB
- Total size: ~230MB (compared to ~1GB for Ubuntu-based images)

## 📋 Build Process

### Using Make (Recommended)
```bash
# Build base image
make build

# Build and test
make all

# Clean up
make clean
```

### Using Scripts Directly
```bash
# Build base image
./scripts/build-base.sh

# Build with custom tag
./scripts/build-base.sh v1.0.0

# Test the image
./scripts/test-base.sh phialo-ci-base:latest
```

### Using Docker Compose
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📦 GitHub Container Registry

All CI images are automatically published to GitHub Container Registry:

```bash
# Latest stable versions
ghcr.io/[owner]/phialo-ci-base:latest
ghcr.io/[owner]/phialo-test:latest
ghcr.io/[owner]/phialo-build-deploy:latest

# PR-specific versions
ghcr.io/[owner]/phialo-ci-base:pr-123-ci-base
```

### Using Registry Images

```bash
# Login to registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull and use images
docker pull ghcr.io/[owner]/phialo-test:latest
docker run --rm -v $(pwd):/workspace ghcr.io/[owner]/phialo-test:latest pnpm test:e2e
```

## 🧪 Testing

The test suite verifies:
- All required tools are installed
- Correct versions are available
- Environment variables are set
- User permissions are correct
- Package installation works
- Native module compilation works

Run tests with:
```bash
make test

# Test CI/CD pipeline locally
./scripts/test-ci-pipeline.sh
```

## 🔧 Customization

### Extending the Base Image

Create a new Dockerfile:
```dockerfile
FROM phialo-ci-base:latest

# Add your customizations
RUN pnpm install -g some-tool

# Copy application code
COPY . /app

# Run your commands
CMD ["pnpm", "test"]
```

### Adding New Tools

Edit `base/Dockerfile.base` and add to the system dependencies:
```dockerfile
RUN apk add --no-cache \
    # Existing tools...
    your-new-tool \
    && rm -rf /var/cache/apk/*
```

## 🏗️ CI/CD Integration

### GitHub Actions
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: phialo-ci-base:latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm test
```

### Local Testing
```bash
# Run tests in CI environment
docker run --rm -v $(pwd):/app phialo-ci-base:latest \
  sh -c "cd /app && pnpm install && pnpm test"
```

## 📊 Performance Metrics

- **Build time**: ~30 seconds (with cache)
- **Image size**: ~230MB
- **Cold start**: <2 seconds
- **Package install**: 10-15 seconds (with pnpm cache)

## 🔍 Troubleshooting

### Build Failures
```bash
# Clear Docker cache
docker builder prune -f

# Rebuild without cache
DOCKER_BUILDKIT=1 docker build --no-cache -f base/Dockerfile.base -t phialo-ci-base .
```

### Permission Issues
```bash
# Run as root user (debugging only)
docker run --rm -it --user root phialo-ci-base:latest /bin/bash
```

### Cache Problems
```bash
# Clear pnpm cache
docker volume rm phialo-ci-pnpm-store

# Clear all CI volumes
make clean
```

## 🛡️ Security Considerations

- Base image uses Alpine Linux (smaller attack surface)
- Runs as non-root user by default
- No unnecessary packages installed
- Regular security updates via base image updates

## 📈 Future Improvements

- [ ] Add image vulnerability scanning
- [ ] Implement automatic base image updates
- [ ] Add support for ARM64 architecture
- [ ] Create specialized images for different CI tasks
- [ ] Add Kubernetes deployment manifests

## 📚 Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [pnpm CI Setup](https://pnpm.io/continuous-integration)
- [Alpine Linux Packages](https://pkgs.alpinelinux.org/packages)