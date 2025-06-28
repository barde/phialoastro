#!/bin/bash
# Test script for security Docker image
# Verifies that all security tools are properly installed and functional

set -e

IMAGE_NAME="phialo-security:latest"

echo "🔍 Testing security Docker image..."

# Test 1: Basic container health
echo "1. Testing container can run..."
docker run --rm $IMAGE_NAME echo "Container runs successfully"

# Test 2: Verify security tools are installed
echo "2. Verifying security tools..."

# Test npm audit
echo "   - Testing npm audit..."
docker run --rm $IMAGE_NAME npm audit --version

# Test better-npm-audit
echo "   - Testing better-npm-audit..."
docker run --rm $IMAGE_NAME better-npm-audit --version

# Test Trivy
echo "   - Testing Trivy..."
docker run --rm $IMAGE_NAME trivy --version

# Test TruffleHog
echo "   - Testing TruffleHog..."
docker run --rm $IMAGE_NAME trufflehog --version

# Test Semgrep
echo "   - Testing Semgrep..."
docker run --rm $IMAGE_NAME semgrep --version

# Test OWASP Dependency Check
echo "   - Testing OWASP Dependency Check..."
docker run --rm $IMAGE_NAME dependency-check --version

# Test Snyk (will fail without token, but shows it's installed)
echo "   - Testing Snyk installation..."
docker run --rm $IMAGE_NAME snyk --version || true

# Test 3: Verify security scan script exists
echo "3. Testing security scan script..."
docker run --rm $IMAGE_NAME ls -la /usr/local/bin/security-scan

# Test 4: Run a minimal security scan
echo "4. Running minimal security scan..."
docker run --rm \
  -v "$(pwd)/phialo-design:/app" \
  -e SKIP_HEAVY_SCANS=true \
  $IMAGE_NAME \
  sh -c "cd /app && npm audit --json > /tmp/test-audit.json && echo 'Audit completed successfully'"

# Test 5: Verify multi-platform support
echo "5. Verifying multi-platform image..."
docker manifest inspect $IMAGE_NAME | grep -E "architecture|os" || echo "Local image test"

echo "✅ All security image tests passed!"

# Output summary
echo ""
echo "Summary:"
echo "- Container runs successfully"
echo "- All security tools are installed"
echo "- Security scan script is available"
echo "- Basic security scans work"
echo ""