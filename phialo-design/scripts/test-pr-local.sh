#!/bin/bash

# Script to simulate PR checks locally
# This runs the same tests that would run in GitHub Actions during a PR
# Helps developers test their changes before pushing

set -e

# Script info
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR=$(dirname "$(readlink -f "$0" 2>/dev/null || echo "$0")")
PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Timing functions
start_time=$(date +%s)
step_start_time=""

start_timer() {
    step_start_time=$(date +%s)
}

end_timer() {
    local step_end_time=$(date +%s)
    local duration=$((step_end_time - step_start_time))
    echo -e "${CYAN}⏱️  Duration: ${duration}s${NC}"
}

# Display header
display_header() {
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${BLUE}🔍 PR Check Simulation${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}This script simulates the checks that run during a GitHub PR.${NC}"
    echo -e "${CYAN}It helps you catch issues before pushing your changes.${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        echo -e "${RED}❌ Error: Must run from phialo-design directory${NC}"
        echo -e "${RED}   Current directory: $(pwd)${NC}"
        echo -e "${RED}   Expected: $PROJECT_ROOT${NC}"
        exit 1
    fi
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE_VERSION="18"
    if [ "$(echo "$NODE_VERSION" | cut -d'.' -f1)" -lt "$REQUIRED_NODE_VERSION" ]; then
        echo -e "${RED}❌ Node.js version $REQUIRED_NODE_VERSION or higher required (found: $NODE_VERSION)${NC}"
        exit 1
    fi
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        pnpm install --frozen-lockfile || npm install
    fi
    
    echo -e "${GREEN}✅ Prerequisites satisfied${NC}"
    echo ""
}

# Display test overview
display_test_overview() {
    echo -e "${BOLD}${YELLOW}📊 Test Overview${NC}"
    echo -e "${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}Tests that will run (PR checks):${NC}"
    echo -e "  ${GREEN}✓${NC} Unit tests (single Node version)"
    echo -e "  ${GREEN}✓${NC} Core E2E tests:"
    echo -e "     • navigation.spec.ts"
    echo -e "     • landing-page.spec.ts"
    echo -e "     • portfolio-filtering.spec.ts"
    echo -e "     • contact-form.spec.ts"
    echo -e "     • responsive.spec.ts"
    echo -e "  ${GREEN}✓${NC} TypeScript compilation"
    echo -e "  ${GREEN}✓${NC} Linting checks"
    echo -e "  ${GREEN}✓${NC} Build verification"
    echo ""
    echo -e "${CYAN}Tests skipped (run on merge to main):${NC}"
    echo -e "  ${YELLOW}○${NC} Full E2E suite (11 additional test files)"
    echo -e "  ${YELLOW}○${NC} Cross-browser matrix (Safari, Edge)"
    echo -e "  ${YELLOW}○${NC} Performance testing (Lighthouse)"
    echo -e "  ${YELLOW}○${NC} Accessibility deep scan"
    echo ""
}

# Run linting
run_linting() {
    echo -e "${BOLD}${YELLOW}🔍 Running Linting Checks${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    start_timer
    
    if pnpm run lint 2>&1 | tee /tmp/lint-output.log; then
        echo -e "${GREEN}✅ Linting passed${NC}"
        end_timer
        return 0
    else
        echo -e "${RED}❌ Linting failed${NC}"
        echo -e "${RED}   Fix issues with: pnpm run lint --fix${NC}"
        end_timer
        return 1
    fi
}

# Run TypeScript checks
run_typecheck() {
    echo ""
    echo -e "${BOLD}${YELLOW}📘 Running TypeScript Checks${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    start_timer
    
    if pnpm run typecheck 2>&1 | tee /tmp/typecheck-output.log; then
        echo -e "${GREEN}✅ TypeScript checks passed${NC}"
        end_timer
        return 0
    else
        echo -e "${RED}❌ TypeScript checks failed${NC}"
        end_timer
        return 1
    fi
}

# Run unit tests
run_unit_tests() {
    echo ""
    echo -e "${BOLD}${YELLOW}🧪 Running Unit Tests${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    start_timer
    
    if pnpm run test:run; then
        echo -e "${GREEN}✅ Unit tests passed${NC}"
        end_timer
        return 0
    else
        echo -e "${RED}❌ Unit tests failed${NC}"
        end_timer
        return 1
    fi
}

# Run E2E tests
run_e2e_tests() {
    echo ""
    echo -e "${BOLD}${YELLOW}🌐 Running Core E2E Tests${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Browser matrix: Chrome, Firefox, Mobile Safari, Mobile Chrome${NC}"
    echo -e "${CYAN}Running 5 core test files...${NC}"
    echo ""
    start_timer
    
    # Check if Playwright browsers are installed
    if [ ! -d "$HOME/.cache/ms-playwright" ]; then
        echo -e "${YELLOW}Installing Playwright browsers...${NC}"
        npx playwright install --with-deps chromium firefox webkit
    fi
    
    if npx playwright test --config=playwright.config.pr.ts; then
        echo -e "${GREEN}✅ E2E tests passed${NC}"
        end_timer
        return 0
    else
        echo -e "${YELLOW}⚠️  E2E tests failed (non-blocking in PR)${NC}"
        echo -e "${YELLOW}   View report: npx playwright show-report${NC}"
        end_timer
        # Return 0 because E2E failures are non-blocking in PRs
        return 0
    fi
}

# Run build
run_build() {
    echo ""
    echo -e "${BOLD}${YELLOW}🏗️  Building Project${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    start_timer
    
    if pnpm run build; then
        echo -e "${GREEN}✅ Build successful${NC}"
        
        # Display build size info
        if [ -d "dist" ]; then
            echo ""
            echo -e "${CYAN}📊 Build Statistics:${NC}"
            echo -e "   Total size: $(du -sh dist | cut -f1)"
            echo -e "   File count: $(find dist -type f | wc -l)"
        fi
        
        end_timer
        return 0
    else
        echo -e "${RED}❌ Build failed${NC}"
        end_timer
        return 1
    fi
}

# Display summary
display_summary() {
    local total_time=$(($(date +%s) - start_time))
    local minutes=$((total_time / 60))
    local seconds=$((total_time % 60))
    
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${GREEN}✨ PR Check Simulation Complete!${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}Total time: ${minutes}m ${seconds}s${NC}"
    echo ""
    echo -e "${BOLD}${YELLOW}💡 Next Steps:${NC}"
    echo -e "  • Review any warnings or failures above"
    echo -e "  • Fix issues before pushing to GitHub"
    echo -e "  • Run ${CYAN}git status${NC} to check for uncommitted changes"
    echo -e "  • Create your PR with confidence!"
    echo ""
    echo -e "${BOLD}${YELLOW}📚 Additional Commands:${NC}"
    echo -e "  • Run full E2E suite: ${CYAN}pnpm run test:e2e${NC}"
    echo -e "  • Run specific E2E test: ${CYAN}npx playwright test <filename>${NC}"
    echo -e "  • Debug E2E tests: ${CYAN}npx playwright test --debug${NC}"
    echo -e "  • View E2E report: ${CYAN}npx playwright show-report${NC}"
    echo -e "  • Run nightly tests: ${CYAN}./scripts/run-nightly-tests.sh${NC}"
    echo ""
}

# Handle errors
handle_error() {
    local exit_code=$1
    echo ""
    echo -e "${BOLD}${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${RED}❌ PR checks failed!${NC}"
    echo -e "${BOLD}${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${RED}Please fix the issues above before creating a PR.${NC}"
    echo ""
    exit $exit_code
}

# Main execution
main() {
    # Trap errors
    trap 'handle_error $?' ERR
    
    # Display header
    display_header
    
    # Check prerequisites
    check_prerequisites
    
    # Display test overview
    display_test_overview
    
    # Run checks in order
    run_linting || exit 1
    run_typecheck || exit 1
    run_unit_tests || exit 1
    run_e2e_tests || exit 1
    run_build || exit 1
    
    # Display summary
    display_summary
}

# Run main function
main "$@"