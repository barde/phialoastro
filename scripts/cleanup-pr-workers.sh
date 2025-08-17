#!/bin/bash

# Script to clean up dangling PR worker instances from Cloudflare
# This script requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID environment variables

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧹 Cloudflare PR Workers Cleanup Script"
echo "======================================="

# Check for required environment variables
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}❌ Error: CLOUDFLARE_API_TOKEN environment variable is not set${NC}"
    echo "Please set it with: export CLOUDFLARE_API_TOKEN='your-token'"
    exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Error: CLOUDFLARE_ACCOUNT_ID environment variable is not set${NC}"
    echo "Please set it with: export CLOUDFLARE_ACCOUNT_ID='your-account-id'"
    exit 1
fi

# Change to workers directory
cd "$(dirname "$0")/../workers" || exit 1

# Install wrangler if not present
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo "Installing wrangler..."
npm install wrangler@4.27.0 --silent

echo -e "${GREEN}✅ Authentication configured${NC}"
echo ""

# List all workers using the Cloudflare API
echo "Fetching list of workers from Cloudflare..."
WORKERS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json" | jq -r '.result[].id' 2>/dev/null || echo "")

if [ -z "$WORKERS" ]; then
    echo -e "${YELLOW}⚠️  No workers found or unable to fetch workers list${NC}"
    echo "This could mean:"
    echo "  - No workers exist in your account"
    echo "  - The API token doesn't have sufficient permissions"
    echo "  - The account ID is incorrect"
    exit 1
fi

# Filter for PR workers (phialo-pr-*)
PR_WORKERS=$(echo "$WORKERS" | grep '^phialo-pr-[0-9]\+$' || true)

if [ -z "$PR_WORKERS" ]; then
    echo -e "${GREEN}✅ No PR workers found to clean up!${NC}"
    exit 0
fi

# Count PR workers
WORKER_COUNT=$(echo "$PR_WORKERS" | wc -l | tr -d ' ')
echo -e "${YELLOW}Found $WORKER_COUNT PR worker(s) to clean up:${NC}"
echo "$PR_WORKERS" | sed 's/^/  - /'
echo ""

# Ask for confirmation
read -p "Do you want to delete all these PR workers? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Starting cleanup..."
echo ""

# Delete each PR worker
DELETED_COUNT=0
FAILED_COUNT=0

while IFS= read -r worker; do
    if [ -z "$worker" ]; then
        continue
    fi
    
    echo -n "Deleting $worker... "
    
    if npx wrangler delete --name "$worker" --force 2>/dev/null; then
        echo -e "${GREEN}✅ Deleted${NC}"
        ((DELETED_COUNT++))
    else
        echo -e "${RED}❌ Failed${NC}"
        ((FAILED_COUNT++))
    fi
done <<< "$PR_WORKERS"

echo ""
echo "======================================="
echo "Cleanup Summary:"
echo -e "  ${GREEN}✅ Successfully deleted: $DELETED_COUNT${NC}"

if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "  ${RED}❌ Failed to delete: $FAILED_COUNT${NC}"
else
    echo -e "  ${GREEN}🎉 All PR workers cleaned up successfully!${NC}"
fi

echo ""
echo "To prevent future dangling workers, the GitHub Actions cleanup workflow has been analyzed."
echo "Consider implementing one of these solutions:"
echo "  1. Add existence checking before deletion attempts"
echo "  2. Use PR labels to track which PRs have deployed workers"
echo ""
echo "See the updated workflows for implementation details."