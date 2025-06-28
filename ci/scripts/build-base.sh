#!/bin/bash
set -euo pipefail

# Build script for Phialo CI base image
# This script builds and tags the base CI Docker image

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CI_ROOT="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="phialo-ci-base"
IMAGE_TAG="${1:-latest}"

echo "🐳 Building Phialo CI Base Image..."
echo "=================================="
echo "Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "Context: ${CI_ROOT}/base"
echo ""

# Build the image (with BuildKit if available)
if docker buildx version > /dev/null 2>&1; then
  echo "Using Docker BuildKit..."
  DOCKER_BUILDKIT=1 docker build \
    --file "${CI_ROOT}/base/Dockerfile.base" \
    --tag "${IMAGE_NAME}:${IMAGE_TAG}" \
    --tag "${IMAGE_NAME}:latest" \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --progress=plain \
    "${CI_ROOT}/base"
else
  echo "Using standard Docker build..."
  docker build \
    --file "${CI_ROOT}/base/Dockerfile.base" \
    --tag "${IMAGE_NAME}:${IMAGE_TAG}" \
    --tag "${IMAGE_NAME}:latest" \
    "${CI_ROOT}/base"
fi

# Show image info
echo ""
echo "✅ Build complete!"
echo ""
echo "Image details:"
docker images "${IMAGE_NAME}:${IMAGE_TAG}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

# Show layer information
echo ""
echo "Layer analysis:"
docker history "${IMAGE_NAME}:${IMAGE_TAG}" --format "table {{.CreatedBy}}\t{{.Size}}" | head -20

# Test the image
echo ""
echo "🧪 Testing image..."
docker run --rm "${IMAGE_NAME}:${IMAGE_TAG}"

echo ""
echo "✨ Base image ready for use!"
echo "To use in other Dockerfiles: FROM ${IMAGE_NAME}:${IMAGE_TAG}"