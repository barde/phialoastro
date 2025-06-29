#!/bin/bash
# Test the build/deploy image functionality
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Testing Build/Deploy Image ==="
echo ""

cd "$PROJECT_ROOT/ci"

# First build the image if it doesn't exist
if ! docker image inspect phialo-design:build >/dev/null 2>&1; then
    echo "→ Building image first..."
    "$SCRIPT_DIR/build-deploy.sh"
fi

# Test 1: Help command
echo "→ Test 1: Help command"
docker run --rm phialo-design:build
echo ""

# Test 2: Build for preview
echo "→ Test 2: Building for preview"
docker-compose -f build/docker-compose.yml run --rm build-preview
echo ""

# Test 3: Bundle analysis
echo "→ Test 3: Bundle analysis"
docker-compose -f build/docker-compose.yml run --rm analyze
echo ""

# Test 4: Image optimization (dry run)
echo "→ Test 4: Image optimization check"
docker run --rm \
    -v "$PROJECT_ROOT/phialo-design/public:/workspace/phialo-design/public:ro" \
    phialo-design:build \
    bash -c "find /workspace/phialo-design/public -name '*.jpg' -o -name '*.png' | head -10"
echo ""

# Test 5: Check deployment readiness
echo "→ Test 5: Deployment readiness check"
docker run --rm phialo-design:build bash -c "
    echo 'Checking deployment tools...'
    which wrangler && echo '✓ Wrangler installed'
    which npx && echo '✓ NPX available'
    which sharp-cli && echo '✓ Sharp CLI installed'
    which svgo && echo '✓ SVGO installed'
    echo ''
    echo 'Checking workspace structure...'
    ls -la /workspace/phialo-design/package.json >/dev/null 2>&1 && echo '✓ Phialo design package found'
    ls -la /workspace/workers/package.json >/dev/null 2>&1 && echo '✓ Workers package found'
    ls -la /scripts/*.sh | wc -l | xargs echo '✓ Deployment scripts found:'
"

echo ""
echo "✓ All tests completed!"