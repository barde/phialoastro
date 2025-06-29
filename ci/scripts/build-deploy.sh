#!/bin/bash
# Build the build/deploy Docker image
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Building Phialo Design Build/Deploy Image ==="
echo ""

cd "$PROJECT_ROOT/ci"

# Build the image
echo "→ Building Docker image..."
docker build \
    -f build/Dockerfile \
    -t phialo-design:build \
    -t phialo-design:build-$(date +%Y%m%d) \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    "$PROJECT_ROOT"

# Show image info
echo ""
echo "→ Image built successfully!"
docker images phialo-design:build

echo ""
echo "✓ Build/deploy image ready!"
echo ""
echo "Usage examples:"
echo "  # Build for production:"
echo "  docker run --rm -v $PROJECT_ROOT/phialo-design/dist:/workspace/phialo-design/dist phialo-design:build /scripts/build.sh"
echo ""
echo "  # Deploy to preview:"
echo "  docker run --rm -e CLOUDFLARE_API_TOKEN=xxx -e CLOUDFLARE_ACCOUNT_ID=xxx phialo-design:build /scripts/deploy-preview.sh"
echo ""
echo "  # Full deployment pipeline:"
echo "  docker run --rm -e CLOUDFLARE_API_TOKEN=xxx -e CLOUDFLARE_ACCOUNT_ID=xxx -v $PROJECT_ROOT:/workspace phialo-design:build /scripts/full-deploy.sh"