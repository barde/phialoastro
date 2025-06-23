#!/bin/bash

# Script to run PR tests locally
# This mimics what happens in CI for PR checks

echo "🧪 Running PR Test Suite"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Run unit tests
echo "📦 Running unit tests..."
if pnpm run test:run; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    exit 1
fi

echo ""
echo "🌐 Running core E2E tests..."
echo "Using reduced browser matrix: Chrome, Firefox, Mobile Safari, Mobile Chrome"

# Run E2E tests with PR config
if npx playwright test --config=playwright.config.pr.ts; then
    echo -e "${GREEN}✅ E2E tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  E2E tests failed (non-blocking in PR)${NC}"
fi

echo ""
echo "🏗️  Building project..."
if pnpm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ PR tests complete!${NC}"
echo ""
echo "💡 Tips:"
echo "  - This runs the same tests as GitHub Actions for PRs"
echo "  - Full E2E suite runs on merge to main"
echo "  - Use 'pnpm run test:e2e' to run all E2E tests locally"