#!/bin/bash
# Full deployment pipeline: build, optimize, analyze, deploy
set -euo pipefail

echo "=== Full Deployment Pipeline ==="
echo ""
echo "Environment: ${ENVIRONMENT:-production}"
echo "Start time: $(date)"
echo ""

# Determine which scripts to run based on environment
if [ "${ENVIRONMENT:-production}" = "preview" ]; then
    BUILD_SCRIPT="/scripts/build-preview.sh"
    DEPLOY_SCRIPT="/scripts/deploy-preview.sh"
else
    BUILD_SCRIPT="/scripts/build.sh"
    DEPLOY_SCRIPT="/scripts/deploy.sh"
fi

# Step 1: Optimize images (if enabled)
if [ "${OPTIMIZE_IMAGES:-true}" = "true" ]; then
    echo "=== Step 1/4: Image Optimization ==="
    /scripts/optimize-images.sh
    echo ""
fi

# Step 2: Build the site
echo "=== Step 2/4: Building Site ==="
$BUILD_SCRIPT
echo ""

# Step 3: Analyze bundle
echo "=== Step 3/4: Bundle Analysis ==="
/scripts/analyze-bundle.sh
echo ""

# Step 4: Deploy to Cloudflare
echo "=== Step 4/4: Deployment ==="
$DEPLOY_SCRIPT
echo ""

echo "=== Deployment Pipeline Complete ==="
echo "End time: $(date)"
echo ""
echo "✓ All steps completed successfully!"