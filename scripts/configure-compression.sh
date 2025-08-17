#!/bin/bash

# Cloudflare Compression Rules Configuration Script
# This script sets up compression rules for the phialo.de zone

set -e

# Check for required environment variables
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "Error: CLOUDFLARE_API_TOKEN environment variable is not set"
    echo "Please set it with your Cloudflare API token that has Zone:Edit permissions"
    exit 1
fi

if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    echo "Error: CLOUDFLARE_ZONE_ID environment variable is not set"
    echo "Please set it with your Cloudflare Zone ID for phialo.de"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Configuring Cloudflare Compression Rules...${NC}"

# Function to get the ruleset ID for compression rules
get_ruleset_id() {
    echo -e "${YELLOW}Fetching ruleset ID...${NC}"
    
    RESPONSE=$(curl -s -X GET \
        "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/rulesets" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json")
    
    # Extract the http_response_compression ruleset ID
    RULESET_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*","name":"[^"]*","phase":"http_response_compression"' | sed 's/.*"id":"\([^"]*\)".*/\1/')
    
    if [ -z "$RULESET_ID" ]; then
        echo -e "${YELLOW}No compression ruleset found. Creating one...${NC}"
        
        # Create a new ruleset for compression
        CREATE_RESPONSE=$(curl -s -X POST \
            "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/rulesets" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
                "name": "Compression Rules",
                "phase": "http_response_compression",
                "rules": []
            }')
        
        RULESET_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\([^"]*\)"/\1/')
    fi
    
    echo "Ruleset ID: $RULESET_ID"
}

# Get or create the ruleset ID
get_ruleset_id

if [ -z "$RULESET_ID" ]; then
    echo -e "${RED}Error: Could not get or create ruleset ID${NC}"
    exit 1
fi

# Configure compression rules
echo -e "${YELLOW}Applying compression rules...${NC}"

RULES_CONFIG='{
  "rules": [
    {
      "ref": "enable_brotli_and_gzip",
      "description": "Enable Brotli and Gzip compression for compressible content",
      "expression": "(http.response.content_type.media_type in {\"text/html\" \"text/css\" \"text/javascript\" \"application/javascript\" \"application/json\" \"text/xml\" \"application/xml\" \"image/svg+xml\" \"text/plain\" \"application/x-font-ttf\" \"application/x-font-opentype\" \"application/vnd.ms-fontobject\"})",
      "action": "compress_response",
      "action_parameters": {
        "algorithms": [
          { "name": "brotli" },
          { "name": "gzip" }
        ]
      }
    },
    {
      "ref": "disable_compression_for_images",
      "description": "Disable compression for already compressed image formats",
      "expression": "(http.response.content_type.media_type in {\"image/jpeg\" \"image/png\" \"image/gif\" \"image/webp\" \"image/avif\" \"video/mp4\" \"video/webm\" \"application/pdf\" \"application/zip\"})",
      "action": "compress_response",
      "action_parameters": {
        "algorithms": []
      }
    },
    {
      "ref": "enable_zstd_for_large_files",
      "description": "Enable Zstandard compression for large text files",
      "expression": "(http.response.content_type.media_type in {\"text/css\" \"text/javascript\" \"application/javascript\"} and http.response.content_length gt 10000)",
      "action": "compress_response",
      "action_parameters": {
        "algorithms": [
          { "name": "zstd" },
          { "name": "brotli" },
          { "name": "gzip" }
        ]
      }
    }
  ]
}'

# Apply the rules
RESPONSE=$(curl -s -X PUT \
    "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/rulesets/$RULESET_ID" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "$RULES_CONFIG")

# Check if the request was successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Compression rules configured successfully!${NC}"
    echo ""
    echo "Configured rules:"
    echo "1. Enable Brotli and Gzip for text content (HTML, CSS, JS, JSON, XML, etc.)"
    echo "2. Disable compression for already compressed formats (JPEG, PNG, WebP, AVIF, etc.)"
    echo "3. Enable Zstandard for large text files (>10KB)"
    echo ""
    echo -e "${GREEN}Compression is now optimized for phialo.de!${NC}"
else
    echo -e "${RED}✗ Failed to configure compression rules${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

# Optional: Verify the configuration
echo ""
echo -e "${YELLOW}Verifying configuration...${NC}"

VERIFY_RESPONSE=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/rulesets/$RULESET_ID" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json")

if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Configuration verified successfully!${NC}"
    
    # Count the number of rules
    RULE_COUNT=$(echo "$VERIFY_RESPONSE" | grep -o '"ref":"[^"]*"' | wc -l)
    echo "Total compression rules active: $RULE_COUNT"
else
    echo -e "${YELLOW}⚠ Could not verify configuration${NC}"
fi

echo ""
echo -e "${GREEN}Script completed successfully!${NC}"
echo ""
echo "Note: These compression rules work at the Cloudflare edge level."
echo "Combined with the pre-compressed assets and Workers configuration,"
echo "your site now has optimal compression across all layers!"