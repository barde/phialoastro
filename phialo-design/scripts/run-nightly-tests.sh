#!/bin/bash

# Script to run nightly tests locally
# This helps debug issues before they happen in CI

set -e

echo "🌙 Running Nightly Test Suite Locally"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from phialo-design directory${NC}"
    exit 1
fi

# Parse arguments
RUN_E2E=true
RUN_PERF=true
RUN_UNIT=true
PROJECT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --e2e-only)
            RUN_PERF=false
            RUN_UNIT=false
            shift
            ;;
        --perf-only)
            RUN_E2E=false
            RUN_UNIT=false
            shift
            ;;
        --unit-only)
            RUN_E2E=false
            RUN_PERF=false
            shift
            ;;
        --project)
            PROJECT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--e2e-only|--perf-only|--unit-only] [--project <project-name>]"
            exit 1
            ;;
    esac
done

# Install dependencies if needed
echo -e "${YELLOW}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    pnpm install --frozen-lockfile
fi

# Run unit tests
if [ "$RUN_UNIT" = true ]; then
    echo ""
    echo -e "${YELLOW}🧪 Running Unit Tests with Coverage...${NC}"
    pnpm run test:run -- --coverage || {
        echo -e "${RED}❌ Unit tests failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Unit tests passed${NC}"
fi

# Run E2E tests
if [ "$RUN_E2E" = true ]; then
    echo ""
    echo -e "${YELLOW}🎭 Running E2E Tests...${NC}"
    
    # Install Playwright browsers if needed
    if [ ! -d "$HOME/.cache/ms-playwright" ]; then
        echo "Installing Playwright browsers..."
        npx playwright install --with-deps
    fi
    
    if [ -n "$PROJECT" ]; then
        echo "Running tests for project: $PROJECT"
        npx playwright test --config=playwright.nightly.config.ts --project="$PROJECT"
    else
        echo "Running all E2E tests (this will take a while)..."
        npx playwright test --config=playwright.nightly.config.ts
    fi
    
    E2E_EXIT_CODE=$?
    if [ $E2E_EXIT_CODE -ne 0 ]; then
        echo -e "${RED}❌ E2E tests failed${NC}"
        echo "View the report: npx playwright show-report"
    else
        echo -e "${GREEN}✅ E2E tests passed${NC}"
    fi
fi

# Run performance tests
if [ "$RUN_PERF" = true ]; then
    echo ""
    echo -e "${YELLOW}⚡ Running Performance Tests...${NC}"
    
    # Build the project
    echo "Building project..."
    pnpm run build
    
    # Start preview server
    echo "Starting preview server..."
    pnpm run preview --port 4322 &
    PREVIEW_PID=$!
    
    # Wait for server to start
    echo "Waiting for server to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:4322 > /dev/null; then
            break
        fi
        sleep 1
    done
    
    # Install Lighthouse if needed
    if ! command -v lhci &> /dev/null; then
        echo "Installing Lighthouse CI..."
        npm install -g @lhci/cli
    fi
    
    # Run Lighthouse
    echo "Running Lighthouse tests..."
    lhci autorun --config=.lighthouserc.json || {
        echo -e "${RED}❌ Performance tests failed${NC}"
        PERF_FAILED=true
    }
    
    # Stop preview server
    kill $PREVIEW_PID 2>/dev/null || true
    
    if [ "$PERF_FAILED" = true ]; then
        echo -e "${RED}❌ Performance tests failed${NC}"
    else
        echo -e "${GREEN}✅ Performance tests passed${NC}"
    fi
fi

echo ""
echo "===================================="
echo -e "${GREEN}🌙 Nightly Test Suite Complete!${NC}"
echo ""
echo "Reports available at:"
echo "  - Unit test coverage: coverage/index.html"
echo "  - E2E test report: playwright-report/index.html"
echo "  - Lighthouse reports: .lighthouseci/"
echo ""
echo "To view E2E report: npx playwright show-report"
echo "To debug failed tests: npx playwright test --debug"