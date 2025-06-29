#!/bin/bash
set -euo pipefail

# Test script for Phialo CI base image
# Verifies all required tools and dependencies are properly installed

IMAGE_NAME="${1:-phialo-ci-base:latest}"
TEST_FAILED=0

echo "🧪 Testing Phialo CI Base Image: ${IMAGE_NAME}"
echo "============================================="
echo ""

# Helper function to run tests
run_test() {
    local test_name="$1"
    local test_cmd="$2"
    
    echo -n "Testing ${test_name}... "
    
    if docker run --rm "${IMAGE_NAME}" sh -c "${test_cmd}" > /dev/null 2>&1; then
        echo "✅ PASSED"
    else
        echo "❌ FAILED"
        TEST_FAILED=1
    fi
}

# Test Node.js installation
run_test "Node.js" "node --version"

# Test pnpm installation
run_test "pnpm" "pnpm --version"

# Test git installation
run_test "Git" "git --version"

# Test Python installation
run_test "Python3" "python3 --version"

# Test make installation
run_test "Make" "make --version"

# Test g++ installation
run_test "g++" "g++ --version"

# Test bash installation
run_test "Bash" "bash --version"

# Test curl installation
run_test "Curl" "curl --version"

# Test netcat installation
run_test "Netcat" "nc -h 2>&1 | grep -q usage"

# Test environment variables
echo ""
echo "Environment Variables:"
docker run --rm "${IMAGE_NAME}" sh -c 'echo "CI=$CI"; echo "NODE_ENV=$NODE_ENV"; echo "PNPM_HOME=$PNPM_HOME"'

# Test user permissions
echo ""
echo "User Information:"
docker run --rm "${IMAGE_NAME}" sh -c 'whoami; id'

# Test working directory
echo ""
echo "Working Directory:"
docker run --rm "${IMAGE_NAME}" sh -c 'pwd'

# Test pnpm configuration
echo ""
echo "pnpm Configuration:"
docker run --rm "${IMAGE_NAME}" sh -c 'pnpm config list'

# Test npm package installation capability
echo ""
echo -n "Testing npm package installation... "
if docker run --rm "${IMAGE_NAME}" sh -c 'cd /tmp && npm init -y > /dev/null 2>&1 && npm install lodash > /dev/null 2>&1'; then
    echo "✅ PASSED"
else
    echo "❌ FAILED"
    TEST_FAILED=1
fi

# Test native module compilation
echo -n "Testing native module compilation... "
if docker run --rm --user root "${IMAGE_NAME}" sh -c 'cd /tmp && npm init -y > /dev/null 2>&1 && npm install bcrypt > /dev/null 2>&1'; then
    echo "✅ PASSED"
else
    echo "❌ FAILED"
    TEST_FAILED=1
fi

# Summary
echo ""
echo "============================================="
if [ $TEST_FAILED -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed!"
    exit 1
fi