#!/bin/bash

# Script to set up Cloudflare secrets for GitHub Actions

set -e

echo "========================================="
echo "🔧 Cloudflare Secrets Setup for GitHub"
echo "========================================="
echo ""

# Check if we have the API token in environment
if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
    echo "✅ Found CLOUDFLARE_API_TOKEN in environment"
    API_TOKEN="$CLOUDFLARE_API_TOKEN"
else
    echo "❌ CLOUDFLARE_API_TOKEN not found in environment"
    echo ""
    echo "To get your API token:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Create a token with permissions:"
    echo "   - Account: Workers Scripts:Edit"
    echo "   - Account: Workers KV Storage:Edit"
    echo ""
    read -p "Enter your Cloudflare API Token: " API_TOKEN
fi

# Get account ID
echo ""
echo "To find your Account ID:"
echo "1. Go to https://dash.cloudflare.com"
echo "2. Select any domain"
echo "3. Look for 'Account ID' in the right sidebar"
echo "   OR check the URL: dash.cloudflare.com/{ACCOUNT_ID}/..."
echo ""

# If we have the token, try to get account ID via API
if [ -n "$API_TOKEN" ]; then
    echo "Attempting to fetch account ID using API token..."
    ACCOUNTS=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts" \
         -H "Authorization: Bearer $API_TOKEN" \
         -H "Content-Type: application/json")
    
    if echo "$ACCOUNTS" | jq -e '.success' > /dev/null 2>&1; then
        ACCOUNT_COUNT=$(echo "$ACCOUNTS" | jq '.result | length')
        if [ "$ACCOUNT_COUNT" -eq 1 ]; then
            ACCOUNT_ID=$(echo "$ACCOUNTS" | jq -r '.result[0].id')
            ACCOUNT_NAME=$(echo "$ACCOUNTS" | jq -r '.result[0].name')
            echo "✅ Found account: $ACCOUNT_NAME"
            echo "   Account ID: $ACCOUNT_ID"
            echo ""
            read -p "Use this account? (y/n): " USE_ACCOUNT
            if [ "$USE_ACCOUNT" != "y" ]; then
                ACCOUNT_ID=""
            fi
        elif [ "$ACCOUNT_COUNT" -gt 1 ]; then
            echo "Found multiple accounts:"
            echo "$ACCOUNTS" | jq -r '.result[] | "  - \(.name): \(.id)"'
            echo ""
            read -p "Enter the Account ID to use: " ACCOUNT_ID
        else
            echo "❌ No accounts found with this API token"
        fi
    else
        echo "❌ Could not fetch accounts (token might not have account:read permission)"
    fi
fi

if [ -z "$ACCOUNT_ID" ]; then
    read -p "Enter your Cloudflare Account ID: " ACCOUNT_ID
fi

# Validate the credentials
echo ""
echo "Validating credentials..."
TEST_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts" \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json")

if echo "$TEST_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ Credentials validated successfully!"
    WORKER_COUNT=$(echo "$TEST_RESPONSE" | jq '.result | length')
    echo "   Found $WORKER_COUNT worker(s) in the account"
else
    echo "❌ Failed to validate credentials"
    echo "Error: $(echo "$TEST_RESPONSE" | jq -r '.errors[0].message')"
    exit 1
fi

echo ""
echo "========================================="
echo "🚀 Setting GitHub Secrets"
echo "========================================="
echo ""

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo ""
    echo "Manual setup instructions:"
    echo "1. Go to https://github.com/$(gh repo view --json owner,name -q '.owner.login + "/" + .name')/settings/secrets/actions"
    echo "2. Add secret CLOUDFLARE_API_TOKEN with value: $API_TOKEN"
    echo "3. Add secret CLOUDFLARE_ACCOUNT_ID with value: $ACCOUNT_ID"
    exit 1
fi

# Set the secrets using gh CLI
echo "Setting CLOUDFLARE_API_TOKEN..."
echo "$API_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN

echo "Setting CLOUDFLARE_ACCOUNT_ID..."
echo "$ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID

echo ""
echo "✅ GitHub secrets configured successfully!"
echo ""
echo "You can now use the Cloudflare worker management workflows:"
echo "1. Go to https://github.com/$(gh repo view --json owner,name -q '.owner.login + "/" + .name')/actions"
echo "2. Run 'Cloudflare - List and Cleanup Workers'"
echo "3. Choose action: list, delete-pr-workers, or delete-specific-worker"
echo ""

# Offer to run the list action immediately
read -p "Would you like to list all workers now? (y/n): " RUN_LIST
if [ "$RUN_LIST" = "y" ]; then
    echo ""
    echo "Running workflow..."
    gh workflow run cloudflare-list-and-cleanup-workers.yml -f action=list -f include_all_workers=true
    echo "✅ Workflow started! Check the Actions tab for results."
fi