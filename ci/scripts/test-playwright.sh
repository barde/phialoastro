#!/bin/bash
# Test script for Playwright Docker image
# Verifies that all browsers work correctly and tests can run

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="phialo-test:latest"
TEST_RESULTS_DIR="$PROJECT_ROOT/test-results"

echo -e "${GREEN}Testing Playwright Docker Image${NC}"
echo "Image: $IMAGE_NAME"

# Check if image exists
if ! docker image inspect "$IMAGE_NAME" > /dev/null 2>&1; then
    echo -e "${RED}Error: Image $IMAGE_NAME not found${NC}"
    echo "Please build the image first with: ./scripts/build-test.sh"
    exit 1
fi

# Create results directory
mkdir -p "$TEST_RESULTS_DIR"

# Test 1: Verify Playwright installation
echo -e "\n${GREEN}Test 1: Verifying Playwright installation${NC}"
if docker run --rm "$IMAGE_NAME" pnpm exec playwright --version; then
    echo -e "${GREEN}✓ Playwright is installed${NC}"
else
    echo -e "${RED}✗ Playwright installation check failed${NC}"
    exit 1
fi

# Test 2: List installed browsers
echo -e "\n${GREEN}Test 2: Checking installed browsers${NC}"
docker run --rm "$IMAGE_NAME" pnpm exec playwright show-browsers || true

# Test 3: Verify each browser can launch
echo -e "\n${GREEN}Test 3: Testing browser launches${NC}"

# Test Chromium
echo -e "\n${YELLOW}Testing Chromium...${NC}"
docker run --rm "$IMAGE_NAME" /bin/sh -c "
    cat > /tmp/test-chromium.js << 'EOF'
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('about:blank');
    console.log('Chromium: OK - Version:', await browser.version());
    await browser.close();
})();
EOF
    node /tmp/test-chromium.js
"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Chromium works${NC}"
else
    echo -e "${RED}✗ Chromium failed${NC}"
fi

# Test Firefox
echo -e "\n${YELLOW}Testing Firefox...${NC}"
docker run --rm "$IMAGE_NAME" /bin/sh -c "
    cat > /tmp/test-firefox.js << 'EOF'
const { firefox } = require('playwright');
(async () => {
    const browser = await firefox.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('about:blank');
    console.log('Firefox: OK');
    await browser.close();
})();
EOF
    node /tmp/test-firefox.js
"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Firefox works${NC}"
else
    echo -e "${RED}✗ Firefox failed${NC}"
fi

# Test WebKit
echo -e "\n${YELLOW}Testing WebKit...${NC}"
docker run --rm "$IMAGE_NAME" /bin/sh -c "
    cat > /tmp/test-webkit.js << 'EOF'
const { webkit } = require('playwright');
(async () => {
    const browser = await webkit.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('about:blank');
    console.log('WebKit: OK');
    await browser.close();
})();
EOF
    node /tmp/test-webkit.js
"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ WebKit works${NC}"
else
    echo -e "${RED}✗ WebKit failed${NC}"
fi

# Test 4: Run a simple E2E test
echo -e "\n${GREEN}Test 4: Running sample E2E test${NC}"
docker run --rm "$IMAGE_NAME" /bin/sh -c "
    mkdir -p /tmp/test-e2e
    cat > /tmp/test-e2e/sample.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('sample test', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);
    const heading = page.locator('h1');
    await expect(heading).toHaveText('Example Domain');
});
EOF
    cd /tmp/test-e2e && pnpm exec playwright test sample.spec.ts --reporter=list
"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ E2E test execution works${NC}"
else
    echo -e "${RED}✗ E2E test execution failed${NC}"
fi

# Test 5: Check Xvfb (display server)
echo -e "\n${GREEN}Test 5: Checking Xvfb display server${NC}"
docker run --rm "$IMAGE_NAME" /bin/sh -c "
    Xvfb :99 -screen 0 1280x720x24 -ac +extension GLX +render -noreset &
    sleep 2
    if ps aux | grep -v grep | grep Xvfb > /dev/null; then
        echo 'Xvfb: OK - Display server is running'
        pkill Xvfb
    else
        echo 'Xvfb: FAILED - Display server not running'
        exit 1
    fi
"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Xvfb display server works${NC}"
else
    echo -e "${RED}✗ Xvfb display server failed${NC}"
fi

# Test 6: Check video recording capability
echo -e "\n${GREEN}Test 6: Testing video recording${NC}"
docker run --rm "$IMAGE_NAME" /bin/sh -c "
    ffmpeg -version | head -n1
"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ FFmpeg is available for video recording${NC}"
else
    echo -e "${RED}✗ FFmpeg not available${NC}"
fi

# Test 7: Environment variables
echo -e "\n${GREEN}Test 7: Checking environment variables${NC}"
docker run --rm "$IMAGE_NAME" /bin/sh -c "
    echo 'PLAYWRIGHT_BROWSERS_PATH='$PLAYWRIGHT_BROWSERS_PATH
    echo 'DISPLAY='$DISPLAY
    echo 'NODE_ENV='$NODE_ENV
    echo 'CI='$CI
"

echo -e "\n${GREEN}Test Summary${NC}"
echo "All critical components have been tested."
echo -e "\n${GREEN}Image is ready for use!${NC}"
echo -e "\nUsage examples:"
echo "  Run tests:        docker run --rm -v \$(pwd):/app $IMAGE_NAME"
echo "  Debug mode:       docker run -it --rm -v \$(pwd):/app $IMAGE_NAME /bin/bash"
echo "  Specific test:    docker run --rm -v \$(pwd):/app $IMAGE_NAME pnpm test:e2e -- path/to/test.spec.ts"