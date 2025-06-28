# Makefile for containerized development

.PHONY: help build dev test lint e2e clean shell

# Default target
help:
	@echo "Available commands:"
	@echo "  make build    - Build all Docker images"
	@echo "  make dev      - Start development server (http://localhost:4321)"
	@echo "  make test     - Run unit tests"
	@echo "  make lint     - Run linting and type checking"
	@echo "  make e2e      - Run E2E tests"
	@echo "  make shell    - Open shell in development container"
	@echo "  make clean    - Clean up containers and images"
	@echo "  make ci       - Run full CI pipeline locally"

# Build all images
build:
	docker-compose build

# Start development server
dev:
	docker-compose up dev

# Run tests
test:
	docker-compose run --rm test

# Run linting and type checking
lint:
	docker-compose run --rm quality

# Run E2E tests
e2e:
	docker-compose run --rm e2e

# Open shell in container
shell:
	docker-compose run --rm dev /bin/sh

# Run full CI pipeline
ci: lint test
	@echo "CI pipeline passed!"

# Clean up
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

# Build production image
prod:
	docker build -f Dockerfile -t phialo-design:latest .