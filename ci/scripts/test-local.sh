#!/bin/bash
set -euo pipefail

# Local testing script that verifies the CI setup without Docker
# This allows development and testing when Docker is not available

echo "🧪 Local CI Environment Test"
echo "==========================="
echo ""
echo "This script tests the CI requirements locally without Docker"
echo ""

TEST_FAILED=0

# Helper function to check command
check_command() {
    local cmd="$1"
    local name="$2"
    
    echo -n "Checking ${name}... "
    
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1)
        echo "✅ Found: $version"
    else
        echo "❌ Not found"
        TEST_FAILED=1
    fi
}

# Check required tools
echo "Required Tools:"
echo "--------------"
check_command "node" "Node.js"
check_command "pnpm" "pnpm"
check_command "git" "Git"
check_command "python3" "Python 3"
check_command "make" "Make"
check_command "g++" "g++ compiler"
check_command "bash" "Bash"
check_command "curl" "Curl"

# Check Node.js version
echo ""
echo "Version Requirements:"
echo "--------------------"
echo -n "Node.js version (need 20.x)... "
if node --version | grep -q "^v20"; then
    echo "✅ $(node --version)"
else
    echo "❌ Wrong version: $(node --version)"
    TEST_FAILED=1
fi

# Check pnpm version
echo -n "pnpm version (need 9.x)... "
if pnpm --version | grep -q "^9"; then
    echo "✅ $(pnpm --version)"
else
    echo "❌ Wrong version: $(pnpm --version)"
    TEST_FAILED=1
fi

# Test package installation
echo ""
echo "Package Installation Test:"
echo "-------------------------"
echo -n "Creating test directory... "
TEST_DIR=$(mktemp -d)
echo "✅ $TEST_DIR"

cd "$TEST_DIR"

echo -n "Initializing package.json... "
if npm init -y > /dev/null 2>&1; then
    echo "✅ Done"
else
    echo "❌ Failed"
    TEST_FAILED=1
fi

echo -n "Installing test package (lodash)... "
if pnpm add lodash > /dev/null 2>&1; then
    echo "✅ Done"
else
    echo "❌ Failed"
    TEST_FAILED=1
fi

echo -n "Installing native module (bcrypt)... "
if pnpm add bcrypt > /dev/null 2>&1; then
    echo "✅ Done"
else
    echo "❌ Failed (may need additional system dependencies)"
fi

# Clean up
cd - > /dev/null
rm -rf "$TEST_DIR"

# Check environment
echo ""
echo "Environment Variables:"
echo "--------------------"
echo "CI=${CI:-not set}"
echo "NODE_ENV=${NODE_ENV:-not set}"
echo "PATH=$PATH"

# Summary
echo ""
echo "==========================="
if [ $TEST_FAILED -eq 0 ]; then
    echo "✅ Local environment meets CI requirements!"
    echo ""
    echo "You can proceed with building the Docker image when Docker is available."
else
    echo "❌ Some requirements are missing!"
    echo ""
    echo "Please install missing tools before building the CI image."
fi

# Provide Dockerfile validation
echo ""
echo "Dockerfile Validation:"
echo "--------------------"
DOCKERFILE_PATH="/Users/debar/code/phialoastro/ci/base/Dockerfile.base"
if [ -f "$DOCKERFILE_PATH" ]; then
    echo "✅ Dockerfile.base exists"
    echo ""
    echo "First 10 lines:"
    head -n 10 "$DOCKERFILE_PATH" | sed 's/^/  /'
else
    echo "❌ Dockerfile.base not found at $DOCKERFILE_PATH"
fi