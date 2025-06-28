#!/bin/sh
# Security scanning script for Phialo Design
# Runs multiple security tools and generates reports

set -e

echo "🔒 Starting security scan suite..."

# Create report directory
REPORT_DIR="/security-reports"
mkdir -p "$REPORT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run a scan and handle errors
run_scan() {
    local name=$1
    local command=$2
    echo "⏳ Running $name..."
    if eval "$command"; then
        echo "${GREEN}✅ $name completed successfully${NC}"
    else
        echo "${YELLOW}⚠️  $name completed with warnings${NC}"
    fi
}

# 1. Dependency Audit
echo "📦 Scanning dependencies..."

# NPM Audit
run_scan "npm audit" "npm audit --json > $REPORT_DIR/npm-audit.json 2>&1 || true"

# Better NPM Audit (more detailed)
run_scan "better-npm-audit" "better-npm-audit audit --json > $REPORT_DIR/better-npm-audit.json 2>&1 || true"

# Snyk (if token is available)
if [ -n "$SNYK_TOKEN" ]; then
    run_scan "Snyk scan" "snyk test --json > $REPORT_DIR/snyk-results.json 2>&1 || true"
    run_scan "Snyk container scan" "snyk container test $IMAGE_NAME --json > $REPORT_DIR/snyk-container.json 2>&1 || true"
else
    echo "${YELLOW}⚠️  Skipping Snyk scan (no token provided)${NC}"
fi

# OWASP Dependency Check
if [ -f "package.json" ]; then
    run_scan "OWASP Dependency Check" \
        "dependency-check \
        --project 'Phialo Design' \
        --scan . \
        --format JSON \
        --out $REPORT_DIR/dependency-check-report.json \
        --exclude '**/node_modules/**' \
        --exclude '**/test/**' \
        --exclude '**/.git/**' \
        2>&1 || true"
fi

# 2. License Check
echo "📜 Checking licenses..."
run_scan "License checker" \
    "license-checker --json --out $REPORT_DIR/licenses.json --excludePrivatePackages 2>&1 || true"

# 3. Outdated Dependencies
echo "🔄 Checking for outdated dependencies..."
run_scan "npm-check-updates" "ncu --jsonUpgraded > $REPORT_DIR/outdated-deps.json 2>&1 || true"

# 4. Static Application Security Testing (SAST)
echo "🔍 Running SAST scans..."

# Semgrep
if [ -d "src" ] || [ -d "phialo-design/src" ]; then
    run_scan "Semgrep SAST" \
        "semgrep --config=auto --json --output=$REPORT_DIR/semgrep-results.json . 2>&1 || true"
else
    echo "${YELLOW}⚠️  No source directory found for SAST scan${NC}"
fi

# 5. Secret Scanning
echo "🔑 Scanning for secrets..."
run_scan "TruffleHog" \
    "trufflehog filesystem . \
    --json \
    --no-verification \
    --exclude-paths=node_modules \
    > $REPORT_DIR/trufflehog-results.json 2>&1 || true"

# 6. Container Security (if IMAGE_NAME is provided)
if [ -n "$IMAGE_NAME" ]; then
    echo "🐳 Scanning container image..."
    run_scan "Trivy container scan" \
        "trivy image \
        --format json \
        --output $REPORT_DIR/trivy-container.json \
        $IMAGE_NAME 2>&1 || true"
fi

# 7. Generate Summary Report
echo "📊 Generating summary report..."

cat > "$REPORT_DIR/security-summary.md" << EOF
# Security Scan Summary

**Scan Date**: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
**Project**: Phialo Design

## Scan Results

### Dependency Vulnerabilities
EOF

# Parse npm audit results
if [ -f "$REPORT_DIR/npm-audit.json" ]; then
    VULNS=$(jq -r '.metadata.vulnerabilities // {} | to_entries | map("\(.key): \(.value)") | join(", ")' "$REPORT_DIR/npm-audit.json" 2>/dev/null || echo "Error parsing npm audit")
    echo "- **npm audit**: $VULNS" >> "$REPORT_DIR/security-summary.md"
fi

# Parse Snyk results
if [ -f "$REPORT_DIR/snyk-results.json" ]; then
    SNYK_VULNS=$(jq '.vulnerabilities | length' "$REPORT_DIR/snyk-results.json" 2>/dev/null || echo "0")
    echo "- **Snyk**: $SNYK_VULNS vulnerabilities found" >> "$REPORT_DIR/security-summary.md"
fi

# Add container scan results
if [ -f "$REPORT_DIR/trivy-container.json" ]; then
    echo "" >> "$REPORT_DIR/security-summary.md"
    echo "### Container Security" >> "$REPORT_DIR/security-summary.md"
    CRITICAL=$(jq '[.Results[].Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' "$REPORT_DIR/trivy-container.json" 2>/dev/null || echo "0")
    HIGH=$(jq '[.Results[].Vulnerabilities[]? | select(.Severity=="HIGH")] | length' "$REPORT_DIR/trivy-container.json" 2>/dev/null || echo "0")
    echo "- **Trivy**: $CRITICAL critical, $HIGH high severity vulnerabilities" >> "$REPORT_DIR/security-summary.md"
fi

# Add secret scan results
if [ -f "$REPORT_DIR/trufflehog-results.json" ]; then
    echo "" >> "$REPORT_DIR/security-summary.md"
    echo "### Secret Detection" >> "$REPORT_DIR/security-summary.md"
    SECRETS=$(jq -s 'length' "$REPORT_DIR/trufflehog-results.json" 2>/dev/null || echo "0")
    echo "- **TruffleHog**: $SECRETS potential secrets found" >> "$REPORT_DIR/security-summary.md"
fi

echo "" >> "$REPORT_DIR/security-summary.md"
echo "## Report Files" >> "$REPORT_DIR/security-summary.md"
echo "" >> "$REPORT_DIR/security-summary.md"
ls -la "$REPORT_DIR"/*.json 2>/dev/null | awk '{print "- " $9}' >> "$REPORT_DIR/security-summary.md" || true

echo "${GREEN}✅ Security scan completed!${NC}"
echo "📁 Reports saved to: $REPORT_DIR"

# Display summary
cat "$REPORT_DIR/security-summary.md"

# Exit with appropriate code
if [ -f "$REPORT_DIR/npm-audit.json" ]; then
    CRITICAL_VULNS=$(jq -r '.metadata.vulnerabilities.critical // 0' "$REPORT_DIR/npm-audit.json" 2>/dev/null || echo "0")
    if [ "$CRITICAL_VULNS" -gt 0 ]; then
        echo "${RED}❌ Critical vulnerabilities found!${NC}"
        exit 1
    fi
fi

exit 0