#!/bin/bash

# Manual PR workers cleanup script
# Usage: 
#   ./manual-cleanup-pr-workers.sh
# Or with inline credentials:
#   CLOUDFLARE_API_TOKEN="your-token" CLOUDFLARE_ACCOUNT_ID="your-id" ./manual-cleanup-pr-workers.sh

set -e

echo "========================================="
echo "🧹 Manual PR Workers Cleanup"
echo "========================================="
echo ""

# Check for credentials
if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "❌ Credentials not found in environment"
    echo ""
    echo "Please provide credentials by either:"
    echo "1. Setting environment variables:"
    echo "   export CLOUDFLARE_API_TOKEN='your-token'"
    echo "   export CLOUDFLARE_ACCOUNT_ID='your-account-id'"
    echo ""
    echo "2. Running with inline variables:"
    echo "   CLOUDFLARE_API_TOKEN='token' CLOUDFLARE_ACCOUNT_ID='id' $0"
    echo ""
    echo "3. Or enter them now:"
    read -p "API Token: " CLOUDFLARE_API_TOKEN
    read -p "Account ID: " CLOUDFLARE_ACCOUNT_ID
fi

# Install wrangler if needed
cd "$(dirname "$0")/workers"
if ! [ -f "node_modules/.bin/wrangler" ]; then
    echo "Installing wrangler..."
    npm install wrangler@4.27.0 --silent
fi

# Fetch all workers
echo "Fetching workers from Cloudflare..."
RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts" \
     -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
     -H "Content-Type: application/json")

# Check if successful
if ! echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "❌ Failed to connect to Cloudflare"
    echo "Error: $(echo "$RESPONSE" | jq -r '.errors[0].message')"
    exit 1
fi

# Get all workers
ALL_WORKERS=$(echo "$RESPONSE" | jq -r '.result[].id' 2>/dev/null || echo "")

if [ -z "$ALL_WORKERS" ]; then
    echo "✅ No workers found in the account"
    exit 0
fi

# Count total
TOTAL=$(echo "$ALL_WORKERS" | wc -l | tr -d ' ')
echo "✅ Found $TOTAL total workers"

# Filter PR workers
PR_WORKERS=$(echo "$ALL_WORKERS" | grep '^phialo-pr-' || echo "")

if [ -z "$PR_WORKERS" ]; then
    echo "✅ No PR workers found to clean up"
    echo ""
    echo "All workers in account:"
    echo "$ALL_WORKERS" | sed 's/^/  - /'
    exit 0
fi

# Count PR workers
PR_COUNT=$(echo "$PR_WORKERS" | wc -l | tr -d ' ')
echo ""
echo "⚠️  Found $PR_COUNT PR worker(s) to delete:"
echo "$PR_WORKERS" | sed 's/^/  - /'
echo ""

# Ask for confirmation
read -p "Delete all PR workers? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Deleting PR workers..."
DELETED=0
FAILED=0

for worker in $PR_WORKERS; do
    echo -n "Deleting $worker... "
    if npx wrangler delete --name "$worker" --force 2>/dev/null; then
        echo "✅"
        ((DELETED++))
    else
        echo "❌"
        ((FAILED++))
    fi
done

echo ""
echo "========================================="
echo "Summary:"
echo "  ✅ Deleted: $DELETED"
if [ $FAILED -gt 0 ]; then
    echo "  ❌ Failed: $FAILED"
fi
echo "========================================="