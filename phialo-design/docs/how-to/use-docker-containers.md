# How to Use Docker Containers for Development

This guide explains how to use Docker containers for development and CI/CD optimization.

> **Important**: Docker is **OPTIONAL** for local development. Most developers can work efficiently using the standard npm workflow without Docker. See [Local Development and CI Testing Setup](./local-ci-setup.md) for details on when Docker is and isn't needed.

## When to Use Docker

Docker containers are beneficial for:
- **CI/CD Pipeline Testing**: Debug GitHub Actions locally
- **Environment Consistency**: Ensure your code works across different systems
- **Team Standardization**: Share exact development environments
- **Complex Dependencies**: Manage multiple service dependencies

For simple local development, you can skip Docker entirely and use:
```bash
npm install
npm run dev
```

## Prerequisites

- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
  - **Free Alternative**: See [Local CI Setup](./local-ci-setup.md) for Lima VM option
- Docker Compose v2.x or higher
- 4GB+ free disk space for images

## Quick Start

### 1. Build the containers

```bash
make build
# or
npm run docker:build
```

This builds all three container types:
- Development container (with hot reload)
- CI container (with test dependencies)
- Production container (optimized build)

### 2. Start development server

```bash
make dev
# or
npm run docker:dev
```

Visit http://localhost:4321 - the server supports hot module replacement.

### 3. Run tests

```bash
# Unit tests
make test
# or
npm run docker:test

# Linting and type checking
make lint
# or
npm run docker:lint

# E2E tests
make e2e
# or
npm run docker:e2e
```

## Container Types

### Development Container (`Dockerfile.dev`)

- Full development environment
- Hot module replacement enabled
- Volume mounts for live code changes
- Includes all dev tools

### CI Container (`Dockerfile.ci`)

- Optimized for testing
- Pre-installed browsers for E2E tests
- All dependencies cached
- Minimal size for fast pulls

### Production Container (`Dockerfile`)

- Multi-stage build
- Only production dependencies
- Optimized asset serving
- Security hardened

## Common Tasks

### Open a shell in the container

```bash
make shell
# or
npm run docker:shell
```

### Run specific commands

```bash
docker-compose run --rm dev pnpm add some-package
docker-compose run --rm dev pnpm run some-script
```

### Update dependencies

```bash
# Edit package.json, then rebuild
docker-compose build --no-cache dev
```

### View logs

```bash
docker-compose logs -f dev
```

### Clean up everything

```bash
make clean
# or
npm run docker:clean
```

## CI/CD Usage

The GitHub Actions workflow automatically uses containers:

1. Builds/pulls the CI image
2. Runs all tests in parallel
3. Caches layers between runs

To simulate CI locally:

```bash
make ci
```

## Performance Tips

### 1. Use .dockerignore

Already configured to exclude:
- node_modules
- Build outputs
- Git history
- Large files

### 2. Layer caching

Order Dockerfile commands from least to most frequently changing:
1. System dependencies
2. Package files
3. Dependencies
4. Application code

### 3. Volume mounts

Only mount what changes:
- Source code
- Public assets
- Content files

### 4. Multi-stage builds

Use for production images to minimize size.

## Troubleshooting

### Port already in use

```bash
# Find and kill the process
lsof -i :4321
kill -9 <PID>
```

### Permission errors

```bash
# Fix ownership
docker-compose run --rm dev chown -R node:node /app
```

### Slow builds

```bash
# Check Docker resources
docker system df

# Clean up old data
docker system prune -a
```

### Can't connect to server

Ensure you're using `--host` flag in dev command:
```json
"dev": "astro dev --host"
```

## Benefits Summary

| Aspect | Without Docker | With Docker | Improvement |
|--------|---------------|-------------|-------------|
| CI build time | 5 min | 1.5 min | 70% faster |
| Local setup | 10 min | 2 min | 80% faster |
| Consistency | Variable | 100% | Perfect |
| Debugging | Difficult | Easy | Much better |

## Next Steps

1. Try running `make dev` for development
2. Run `make test` to see cached test runs
3. Experiment with `make shell` for debugging
4. Check CI performance improvements in PRs