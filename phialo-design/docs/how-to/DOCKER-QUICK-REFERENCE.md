# Docker Quick Reference for Phialo Design

## Essential Commands

### Development
```bash
# Start dev server
docker-compose up dev

# Start dev with logs
docker-compose up dev --follow

# Rebuild and start
docker-compose up --build dev

# Stop all services
docker-compose down

# Access shell in dev container
docker-compose run --rm dev /bin/bash
```

### Testing
```bash
# Run unit tests
docker-compose run --rm test

# Run E2E tests
docker-compose run --rm e2e

# Run specific test file
docker-compose run --rm test pnpm test -- button.test.tsx

# Run tests in watch mode
docker-compose run --rm test pnpm test

# Debug E2E tests
docker-compose run --rm e2e pnpm test:e2e:debug
```

### Quality Checks
```bash
# Run all quality checks
docker-compose run --rm quality

# Run linting only
docker-compose run --rm test pnpm lint

# Run type checking only
docker-compose run --rm test pnpm typecheck

# Fix linting issues
docker-compose run --rm test pnpm lint:fix
```

### Production
```bash
# Build for production
docker-compose run --rm build

# Preview production build
docker-compose up preview

# Build and deploy
docker-compose run --rm build && pnpm deploy
```

### CI Simulation
```bash
# Run full CI pipeline locally
docker-compose run --rm ci

# Run PR-specific tests
docker-compose run --rm test pnpm test:pr
```

## Advanced Usage

### Building Images
```bash
# Build specific stage
docker build --target=ci -t phialo:ci -f Dockerfile.ci .

# Build with cache export
docker buildx build --cache-to=type=local,dest=/tmp/cache .

# Build for multiple platforms
docker buildx build --platform=linux/amd64,linux/arm64 .
```

### Cache Management
```bash
# View cache usage
docker system df

# Clear build cache
docker builder prune

# Clear everything (careful!)
docker system prune -a

# Keep pnpm cache
docker volume prune --filter label!=pnpm-store
```

### Debugging
```bash
# View container logs
docker-compose logs -f dev

# Inspect running containers
docker-compose ps

# Execute command in running container
docker-compose exec dev pnpm list

# View image layers
docker history phialo:ci

# Inspect image
docker inspect phialo:ci
```

### Performance Monitoring
```bash
# View resource usage
docker stats

# Check container health
docker-compose ps

# Time a build
time docker-compose build test

# Build with detailed progress
DOCKER_BUILDKIT=1 docker build --progress=plain .
```

## Environment Variables

### Development
```bash
# Custom port
PHIALO_PORT=5000 docker-compose up dev

# Enable debug output
DEBUG=* docker-compose up dev

# Disable color output
NO_COLOR=1 docker-compose run test
```

### Testing
```bash
# Run specific test tags
TEST_TAG=@critical docker-compose run e2e

# Change parallel workers
CI=true WORKERS=8 docker-compose run e2e

# Custom base URL
BASE_URL=http://localhost:5000 docker-compose run e2e
```

## Tips & Tricks

### 1. Faster Builds
```bash
# Use BuildKit
export DOCKER_BUILDKIT=1

# Pull latest base images
docker-compose pull

# Build in parallel
docker-compose build --parallel
```

### 2. Development Workflow
```bash
# Auto-restart on failure
docker-compose up --restart=unless-stopped dev

# Run multiple services
docker-compose up dev quality

# Scale services
docker-compose up --scale test=3
```

### 3. Troubleshooting
```bash
# Check service health
docker-compose ps

# View recent logs
docker-compose logs --tail=50 dev

# Remove orphan containers
docker-compose down --remove-orphans

# Rebuild from scratch
docker-compose build --no-cache
```

### 4. VS Code Integration
```bash
# Start VS Code dev environment
docker-compose up dev-vscode

# Connect via Remote-SSH to localhost:2222
# Username: developer
# Password: (set in container)
```

## Common Issues

### Port Already in Use
```bash
# Find process using port
lsof -i :4321

# Use different port
PHIALO_PORT=5000 docker-compose up dev
```

### Permission Issues
```bash
# Fix ownership
docker-compose run --rm dev chown -R node:node /app

# Run as root (debugging only)
docker-compose run --rm --user root dev /bin/bash
```

### Out of Space
```bash
# Check space usage
docker system df

# Clean up
docker system prune -a --volumes

# Remove old images
docker images | grep "<none>" | awk '{print $3}' | xargs docker rmi
```

## Aliases for Efficiency

Add to your shell profile:
```bash
# Docker Compose shortcuts
alias dcu='docker-compose up'
alias dcd='docker-compose down'
alias dcr='docker-compose run --rm'
alias dcb='docker-compose build'
alias dcp='docker-compose ps'
alias dcl='docker-compose logs -f'

# Phialo-specific
alias phialo-dev='docker-compose up dev'
alias phialo-test='docker-compose run --rm test'
alias phialo-e2e='docker-compose run --rm e2e'
alias phialo-ci='docker-compose run --rm ci'
alias phialo-build='docker-compose run --rm build'
```

## Quick Health Check

Run this to verify your Docker setup:
```bash
#!/bin/bash
echo "🐳 Docker version:"
docker --version
echo "🏗️  Docker Compose version:"
docker-compose --version
echo "📦 BuildKit enabled:"
echo $DOCKER_BUILDKIT
echo "🧪 Testing build:"
docker-compose build test --progress=plain
echo "✅ Setup complete!"
```