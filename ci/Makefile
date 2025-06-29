# Makefile for Phialo CI Docker Images
.PHONY: help build test clean shell push pull all build-test test-playwright e2e build-deploy test-deploy deploy-preview deploy-prod

# Default target
help:
	@echo "Phialo CI Docker Management"
	@echo "=========================="
	@echo "Base image targets:"
	@echo "  make build         - Build the base CI image"
	@echo "  make test          - Test the base CI image"
	@echo "  make shell         - Open interactive shell in base image"
	@echo ""
	@echo "Test image targets:"
	@echo "  make build-test    - Build the Playwright test image"
	@echo "  make test-playwright - Test Playwright installation"
	@echo "  make e2e           - Run E2E tests in container"
	@echo "  make e2e-shell     - Open shell in test container"
	@echo ""
	@echo "Build/Deploy image targets:"
	@echo "  make build-deploy  - Build the build/deploy image"
	@echo "  make test-deploy   - Test deployment image functionality"
	@echo "  make deploy-preview - Deploy to preview environment"
	@echo "  make deploy-prod   - Deploy to production (requires confirmation)"
	@echo "  make deploy-shell  - Open shell in deploy container"
	@echo ""
	@echo "General targets:"
	@echo "  make clean         - Remove all CI images and volumes"
	@echo "  make all           - Build and test everything"
	@echo ""
	@echo "Docker Compose targets:"
	@echo "  make up            - Start all services"
	@echo "  make down          - Stop all services"
	@echo "  make logs          - Show service logs"

# Build the base image
build:
	@echo "Building base CI image..."
	@./scripts/build-base.sh

# Test the base image
test: build
	@echo "Testing base CI image..."
	@./scripts/test-base.sh

# Open interactive shell
shell:
	@echo "Opening shell in CI base image..."
	@docker run -it --rm \
		-v pnpm-store:/pnpm-store \
		phialo-ci-base:latest \
		/bin/bash

# Start services with docker-compose
up:
	@docker-compose up -d ci-base
	@echo "CI base service started"

# Stop services
down:
	@docker-compose down

# Show logs
logs:
	@docker-compose logs -f

# Build the test image
build-test: build
	@echo "Building Playwright test image..."
	@./scripts/build-test.sh

# Test the Playwright installation
test-playwright: build-test
	@echo "Testing Playwright installation..."
	@./scripts/test-playwright.sh

# Run E2E tests
e2e: build-test
	@echo "Running E2E tests in container..."
	@./scripts/run-e2e.sh

# Open shell in test container
e2e-shell: build-test
	@echo "Opening shell in test container..."
	@docker run -it --rm \
		-v $(shell cd ../phialo-design && pwd):/app \
		-v pnpm-store:/pnpm-store \
		phialo-test:latest \
		/bin/bash

# Build the build/deploy image
build-deploy:
	@echo "Building build/deploy image..."
	@./scripts/build-deploy.sh

# Test the deployment image
test-deploy: build-deploy
	@echo "Testing deployment image..."
	@./scripts/test-build-deploy.sh

# Deploy to preview environment
deploy-preview: build-deploy
	@echo "Deploying to preview environment..."
	@docker-compose -f build/docker-compose.yml run --rm deploy-preview

# Deploy to production (with confirmation)
deploy-prod: build-deploy
	@echo "⚠️  WARNING: This will deploy to PRODUCTION!"
	@echo -n "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@echo "Deploying to production..."
	@docker-compose -f build/docker-compose.yml run --rm deploy

# Open shell in deploy container
deploy-shell: build-deploy
	@echo "Opening shell in deploy container..."
	@docker-compose -f build/docker-compose.yml run --rm shell

# Clean up everything
clean:
	@echo "Cleaning up CI images and volumes..."
	@docker-compose down -v
	@docker rmi phialo-ci-base:latest || true
	@docker rmi phialo-test:latest || true
	@docker rmi phialo-design:build || true
	@docker volume rm phialo-ci-pnpm-store || true
	@echo "Cleanup complete"

# Build and test everything
all: build test build-test test-playwright build-deploy test-deploy
	@echo "✅ All CI operations complete!"

# Prune unused Docker resources
prune:
	@echo "Pruning unused Docker resources..."
	@docker system prune -f
	@docker volume prune -f

# Show image size analysis
size:
	@echo "CI Image Size Analysis:"
	@echo "======================="
	@docker images phialo-ci-* --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
	@echo ""
	@echo "Layer breakdown:"
	@docker history phialo-ci-base:latest --human --format "table {{.CreatedBy}}\t{{.Size}}"