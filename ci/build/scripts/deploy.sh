#!/bin/bash
# Deploy script for production
set -euo pipefail

echo "=== Deploying to Cloudflare Workers (Production) ==="
echo ""

# Check required environment variables
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
    echo "❌ Error: CLOUDFLARE_API_TOKEN is required"
    exit 1
fi

if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
    echo "❌ Error: CLOUDFLARE_ACCOUNT_ID is required"
    exit 1
fi

# Set environment
export CLOUDFLARE_ACCOUNT_ID
export CLOUDFLARE_API_TOKEN
export NODE_ENV=production

cd /workspace/workers

# Deploy to production
echo "→ Deploying to production environment..."
npx wrangler deploy --env production

# Get deployment info
echo ""
echo "→ Verifying deployment..."
WORKER_URL="https://phialo.de"

# Check if site is accessible
if curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL" | grep -q "200"; then
    echo "✓ Site is accessible at: $WORKER_URL"
else
    echo "⚠️  Warning: Site returned non-200 status code"
fi

# Show worker info
echo ""
echo "→ Worker information:"
npx wrangler deployments list --name phialo-design --env production | head -10

echo ""
echo "✓ Production deployment completed!"
echo "🌐 Site URL: $WORKER_URL"