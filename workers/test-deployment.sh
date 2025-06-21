#!/bin/bash

echo "🚀 Testing Worker Deployment and Verification"
echo "==========================================="

# Deploy to preview
echo "📦 Deploying to preview environment..."
DEPLOY_OUTPUT=$(npm run deploy:preview 2>&1)
echo "$DEPLOY_OUTPUT" | tail -20

# Extract URL
PREVIEW_URL=$(echo "$DEPLOY_OUTPUT" | grep -E "https://.*workers\.dev" | tail -1 | tr -d '[:space:]')
echo ""
echo "🔗 Extracted Preview URL: $PREVIEW_URL"

# Verify deployment
echo ""
echo "✅ Verifying deployment..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PREVIEW_URL")

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Success! Preview deployment is accessible (HTTP $HTTP_CODE)"
    echo "🌐 Visit: $PREVIEW_URL"
else
    echo "❌ Error: Preview deployment returned HTTP $HTTP_CODE"
    exit 1
fi