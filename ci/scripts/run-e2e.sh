#!/bin/bash
# Run E2E tests in Docker container
# Supports various test configurations and options

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PHIALO_ROOT="$(cd "$PROJECT_ROOT/../phialo-design" && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="phialo-test:latest"
CONTAINER_NAME="phialo-e2e-runner"

# Default values
TEST_CONFIG="playwright.config.ts"
TEST_TAG=""
WORKERS="4"
INTERACTIVE=false
DEBUG=false
UPDATE_SNAPSHOTS=false

# Parse command line arguments
usage() {
    echo "Usage: $0 [OPTIONS] [TEST_FILES...]"
    echo ""
    echo "Options:"
    echo "  -c, --config FILE     Use specific Playwright config (default: playwright.config.ts)"
    echo "  -t, --tag TAG         Run tests with specific tag (@critical, @smoke, etc.)"
    echo "  -w, --workers NUM     Number of parallel workers (default: 4)"
    echo "  -i, --interactive     Run in interactive mode (keep container running)"
    echo "  -d, --debug           Run in debug mode with headed browser"
    echo "  -u, --update          Update snapshots"
    echo "  -h, --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all tests"
    echo "  $0 -t @critical                       # Run critical tests only"
    echo "  $0 -c playwright.pr.config.ts         # Use PR config"
    echo "  $0 tests/e2e/homepage.spec.ts         # Run specific test file"
    echo "  $0 -d tests/e2e/navigation.spec.ts    # Debug specific test"
}

# Parse arguments
POSITIONAL_ARGS=()
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--config)
            TEST_CONFIG="$2"
            shift 2
            ;;
        -t|--tag)
            TEST_TAG="$2"
            shift 2
            ;;
        -w|--workers)
            WORKERS="$2"
            shift 2
            ;;
        -i|--interactive)
            INTERACTIVE=true
            shift
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -u|--update)
            UPDATE_SNAPSHOTS=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -*)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
        *)
            POSITIONAL_ARGS+=("$1")
            shift
            ;;
    esac
done

# Restore positional parameters
set -- "${POSITIONAL_ARGS[@]}"

echo -e "${GREEN}Running E2E Tests in Docker${NC}"
echo "Image: $IMAGE_NAME"
echo "Config: $TEST_CONFIG"
[ -n "$TEST_TAG" ] && echo "Tag filter: $TEST_TAG"
echo "Workers: $WORKERS"

# Check if image exists
if ! docker image inspect "$IMAGE_NAME" > /dev/null 2>&1; then
    echo -e "${RED}Error: Image $IMAGE_NAME not found${NC}"
    echo "Building image..."
    "$SCRIPT_DIR/build-test.sh"
fi

# Stop any existing container
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

# Prepare docker run command
DOCKER_CMD="docker run --name $CONTAINER_NAME"

# Add volume mounts
DOCKER_CMD="$DOCKER_CMD -v $PHIALO_ROOT:/app"
DOCKER_CMD="$DOCKER_CMD -v $PHIALO_ROOT/test-results:/app/test-results"
DOCKER_CMD="$DOCKER_CMD -v $PHIALO_ROOT/playwright-report:/app/playwright-report"

# Environment variables
DOCKER_CMD="$DOCKER_CMD -e CI=true"
DOCKER_CMD="$DOCKER_CMD -e NODE_ENV=test"
[ -n "$TEST_TAG" ] && DOCKER_CMD="$DOCKER_CMD -e TEST_TAG=$TEST_TAG"

# Add interactive flags if needed
if [ "$INTERACTIVE" = true ] || [ "$DEBUG" = true ]; then
    DOCKER_CMD="$DOCKER_CMD -it"
else
    DOCKER_CMD="$DOCKER_CMD --rm"
fi

# Add display for debug mode
if [ "$DEBUG" = true ]; then
    DOCKER_CMD="$DOCKER_CMD -e HEADED=true"
    # On Linux, share X11 socket
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        DOCKER_CMD="$DOCKER_CMD -e DISPLAY=$DISPLAY"
        DOCKER_CMD="$DOCKER_CMD -v /tmp/.X11-unix:/tmp/.X11-unix"
    fi
fi

DOCKER_CMD="$DOCKER_CMD $IMAGE_NAME"

# Build test command
if [ "$INTERACTIVE" = true ]; then
    TEST_CMD="/bin/bash"
else
    TEST_CMD="pnpm test:e2e"
    
    # Add config if not default
    if [ "$TEST_CONFIG" != "playwright.config.ts" ]; then
        TEST_CMD="$TEST_CMD --config=$TEST_CONFIG"
    fi
    
    # Add workers
    TEST_CMD="$TEST_CMD --workers=$WORKERS"
    
    # Add update snapshots flag
    if [ "$UPDATE_SNAPSHOTS" = true ]; then
        TEST_CMD="$TEST_CMD --update-snapshots"
    fi
    
    # Add debug flag
    if [ "$DEBUG" = true ]; then
        TEST_CMD="$TEST_CMD --debug"
    fi
    
    # Add test files if specified
    if [ $# -gt 0 ]; then
        TEST_CMD="$TEST_CMD -- $*"
    fi
fi

# Run the tests
echo -e "\n${BLUE}Running command:${NC}"
echo "$DOCKER_CMD $TEST_CMD"
echo ""

# Execute
eval "$DOCKER_CMD $TEST_CMD"
EXIT_CODE=$?

# Handle results
if [ "$INTERACTIVE" = false ]; then
    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "\n${GREEN}✓ All tests passed!${NC}"
    else
        echo -e "\n${RED}✗ Tests failed with exit code: $EXIT_CODE${NC}"
        
        # Show report location
        if [ -d "$PHIALO_ROOT/playwright-report" ]; then
            echo -e "\n${YELLOW}View test report:${NC}"
            echo "  cd $PHIALO_ROOT && npx playwright show-report"
        fi
    fi
fi

# Cleanup
if [ "$INTERACTIVE" = false ] && [ "$DEBUG" = false ]; then
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
fi

exit $EXIT_CODE