# Local Development and CI Testing Setup

## Overview

This guide clarifies the development workflow for the Phialo Design project, explaining the distinction between local development and CI/CD containerization.

## Key Principle: Docker-Free Local Development

**Local development does NOT require Docker.** The project is designed for a fast, simple local workflow:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Why No Docker for Local Development?

1. **Speed**: Direct npm commands are faster than container startup
2. **Simplicity**: No need to install or manage Docker Desktop
3. **Resource Efficiency**: Lower memory and CPU usage
4. **Direct Debugging**: Easier access to debugging tools and IDE integration
5. **Hot Reload**: Instant file watching and updates

## When is Docker Used?

Docker is **exclusively** used for:
- GitHub Actions CI/CD pipeline
- Ensuring consistent build environments across different systems
- Production deployment via Cloudflare Workers

The project includes three Dockerfiles for CI/CD automation:
- `Dockerfile` - Production builds
- `Dockerfile.dev` - Development environment (for CI testing)
- `Dockerfile.ci` - Optimized CI/CD pipeline

## Optional: Testing CI Locally with Lima VM

If you need to debug the CI pipeline locally or test Docker builds without Docker Desktop, you can use **Lima VM** as a free alternative.

### What is Lima VM?

Lima (Linux-on-Mac) is a lightweight VM solution that provides:
- Free alternative to Docker Desktop
- Native macOS virtualization (fast)
- Automatic file sharing
- Built-in port forwarding

### Quick Lima Setup

We provide an automated setup script:

```bash
# Run the setup script
./phialo-design/scripts/setup-lima-docker.sh

# The script will:
# 1. Install Lima via Homebrew
# 2. Create an Ubuntu 24.04 VM with Docker
# 3. Configure Docker access from macOS
# 4. Test the installation
```

### Using Lima for CI Testing

Once Lima is set up, you can test CI builds locally:

```bash
# Build the CI container
limactl shell ubuntu-docker -- docker build -f Dockerfile.ci -t phialo-ci .

# Run tests in the CI container
limactl shell ubuntu-docker -- docker run phialo-ci npm test

# Build production image
limactl shell ubuntu-docker -- docker build -t phialo-prod .
```

### Detailed Lima Documentation

For comprehensive Lima setup and usage:
- [Lima Docker Setup Guide](./lima/lima-docker-setup.md) - Full installation walkthrough
- [Lima Docker Working Guide](./lima/lima-docker-working.md) - Quick reference

## Recommended Development Workflow

### For Regular Development

1. Clone the repository
2. Run `npm install`
3. Start with `npm run dev`
4. Make changes and see instant updates
5. Run tests with `npm test`
6. Check code quality with `npm run lint` and `npm run typecheck`

### For CI Pipeline Debugging (Optional)

1. Set up Lima VM using the provided script
2. Build and test Docker images locally
3. Debug any CI-specific issues
4. Push changes knowing they'll work in CI

## Common Questions

**Q: Do I need Docker Desktop for development?**  
A: No, local development is completely Docker-free.

**Q: When would I need Lima VM?**  
A: Only if you're debugging CI pipeline issues or want to test Docker builds locally.

**Q: Is Lima VM required?**  
A: No, it's completely optional. Most development doesn't require it.

**Q: What if I already have Docker Desktop?**  
A: You can use it, but it's not required. Lima is offered as a free alternative.

## Summary

- **Local Development**: Simple, fast, Docker-free (`npm` commands only)
- **CI/CD Pipeline**: Automated, containerized (handled by GitHub Actions)
- **Lima VM**: Optional free tool for local CI testing when needed

This separation ensures the best developer experience while maintaining CI/CD consistency.