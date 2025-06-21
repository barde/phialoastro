#!/bin/bash

echo "🔍 Checking Cloudflare API Token Permissions..."
echo "=============================================="

# Test basic account access
echo -e "\n1. Testing Account Access:"
curl -s -X GET "https://api.cloudflare.com/client/v4/accounts" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json" | jq -r '.success // false'

# Test Workers Scripts access
echo -e "\n2. Testing Workers Scripts Access:"
curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json" | jq -r '.success // false'

# Test KV Namespaces access (this is what's failing)
echo -e "\n3. Testing KV Namespaces Access:"
response=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/storage/kv/namespaces" \
     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
     -H "Content-Type: application/json")

success=$(echo "$response" | jq -r '.success // false')
echo "Success: $success"

if [ "$success" = "false" ]; then
    echo "Error details:"
    echo "$response" | jq -r '.errors[]? | "- Code: \(.code), Message: \(.message)"'
fi

# Show token info
echo -e "\n4. Token Information:"
echo "Token length: ${#CLOUDFLARE_API_TOKEN}"
echo "First 8 chars: ${CLOUDFLARE_API_TOKEN:0:8}..."

echo -e "\n✅ To fix permission issues:"
echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
echo "2. Find your token and click 'Edit'"
echo "3. Ensure these permissions are enabled:"
echo "   - Account > Cloudflare Workers Scripts:Edit"
echo "   - Account > Workers KV Storage:Edit"
echo "4. Save the token (no need to regenerate)"