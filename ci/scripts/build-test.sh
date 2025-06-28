#!/bin/bash
# Build script for Playwright test image
# This script builds the test image on top of the base CI image

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PHIALO_ROOT="$(cd "$PROJECT_ROOT/../phialo-design" && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="phialo-test:latest"
BASE_IMAGE="phialo-ci-base:latest"
DOCKERFILE="$PROJECT_ROOT/test/Dockerfile"

echo -e "${GREEN}Building Playwright Test Image${NC}"
echo "Base image: $BASE_IMAGE"
echo "Target image: $IMAGE_NAME"
echo "Project root: $PHIALO_ROOT"

# Check if base image exists
if ! docker image inspect "$BASE_IMAGE" > /dev/null 2>&1; then
    echo -e "${RED}Error: Base image $BASE_IMAGE not found${NC}"
    echo "Please build the base image first with: make build-base"
    exit 1
fi

# Check if Dockerfile exists
if [ ! -f "$DOCKERFILE" ]; then
    echo -e "${RED}Error: Dockerfile not found at $DOCKERFILE${NC}"
    exit 1
fi

# Check if we're using BuildKit
if [ "${DOCKER_BUILDKIT:-0}" = "1" ]; then
    echo -e "${GREEN}Using BuildKit for improved caching${NC}"
    BUILD_ARGS="--progress=plain"
else
    echo -e "${YELLOW}BuildKit not enabled. Enable with: export DOCKER_BUILDKIT=1${NC}"
    BUILD_ARGS=""
fi

# Build the image with proper context
echo -e "${GREEN}Building test image...${NC}"
cd "$PHIALO_ROOT"

# Build with caching optimizations
docker build \
    $BUILD_ARGS \
    --cache-from "$BASE_IMAGE" \
    --cache-from "$IMAGE_NAME" \
    -f "$DOCKERFILE" \
    -t "$IMAGE_NAME" \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test image built successfully!${NC}"
    
    # Show image info
    echo -e "\n${GREEN}Image Information:${NC}"
    docker images "$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}\t{{.CreatedSince}}"
    
    # Show layer count
    LAYERS=$(docker history "$IMAGE_NAME" -q | wc -l)
    echo -e "\nTotal layers: $LAYERS"
    
    # Verify Playwright installation
    echo -e "\n${GREEN}Verifying Playwright installation...${NC}"
    docker run --rm "$IMAGE_NAME" pnpm exec playwright --version
    
    echo -e "\n${GREEN}Available commands:${NC}"
    echo "  Run all E2E tests:     docker run --rm $IMAGE_NAME"
    echo "  Run specific test:     docker run --rm $IMAGE_NAME pnpm test:e2e -- tests/e2e/homepage.spec.ts"
    echo "  Interactive shell:     docker run -it --rm $IMAGE_NAME /bin/bash"
    echo "  With local files:      docker run -v \$(pwd):/app --rm $IMAGE_NAME"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi