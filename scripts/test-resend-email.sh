#!/bin/bash

# Test script for Resend email integration
# Usage: ./test-resend-email.sh

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Testing Resend Email Integration"
echo "===================================="

# Check if environment variables are set
if [ -z "$RESEND_API_KEY" ]; then
    echo -e "${YELLOW}Warning: RESEND_API_KEY not set in environment${NC}"
    echo "You can set it with: export RESEND_API_KEY='your-api-key'"
    echo ""
fi

# Default test data
TO_EMAIL="${TO_EMAIL:-info@phialo.de}"
FROM_EMAIL="${FROM_EMAIL:-onboarding@resend.dev}"
SUBJECT="Test Email from Phialo Contact Form"
MESSAGE="This is a test message from the Resend email integration. If you receive this, the integration is working correctly!"

echo "Test Configuration:"
echo "  TO_EMAIL: $TO_EMAIL"
echo "  FROM_EMAIL: $FROM_EMAIL"
echo ""

# Function to test Resend API directly
test_resend_api() {
    echo "📧 Testing Resend API directly..."
    
    if [ -z "$RESEND_API_KEY" ]; then
        echo -e "${RED}✗ Cannot test: RESEND_API_KEY not set${NC}"
        return 1
    fi
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://api.resend.com/emails \
        -H "Authorization: Bearer $RESEND_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "from": "'"$FROM_EMAIL"'",
            "to": ["'"$TO_EMAIL"'"],
            "subject": "'"$SUBJECT"'",
            "text": "'"$MESSAGE"'",
            "html": "<p>'"$MESSAGE"'</p>"
        }')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Resend API test successful!${NC}"
        echo "Response: $BODY"
        return 0
    else
        echo -e "${RED}✗ Resend API test failed!${NC}"
        echo "HTTP Code: $HTTP_CODE"
        echo "Response: $BODY"
        return 1
    fi
}

# Function to test contact form API endpoint
test_contact_api() {
    echo ""
    echo "📮 Testing Contact Form API endpoint..."
    
    API_URL="${API_URL:-http://localhost:8787/api/contact}"
    
    echo "Using API URL: $API_URL"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d '{
            "name": "Test User",
            "email": "test@example.com",
            "subject": "Test Contact Form Submission",
            "message": "This is a test message from the contact form API test.",
            "language": "en",
            "sendCopy": true
        }')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Contact API test successful!${NC}"
        echo "Response: $BODY"
        return 0
    else
        echo -e "${RED}✗ Contact API test failed!${NC}"
        echo "HTTP Code: $HTTP_CODE"
        echo "Response: $BODY"
        return 1
    fi
}

# Function to check Resend API key validity
check_api_key() {
    echo ""
    echo "🔑 Checking Resend API key validity..."
    
    if [ -z "$RESEND_API_KEY" ]; then
        echo -e "${RED}✗ RESEND_API_KEY not set${NC}"
        return 1
    fi
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET https://api.resend.com/domains \
        -H "Authorization: Bearer $RESEND_API_KEY")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ API key is valid!${NC}"
        return 0
    elif [ "$HTTP_CODE" = "401" ]; then
        echo -e "${RED}✗ API key is invalid!${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠ Unexpected response code: $HTTP_CODE${NC}"
        return 1
    fi
}

# Main execution
echo ""
echo "Running tests..."
echo ""

# Check API key
check_api_key
KEY_VALID=$?

# Test Resend API directly
if [ $KEY_VALID -eq 0 ]; then
    test_resend_api
fi

# Test contact form API
test_contact_api

echo ""
echo "===================================="
echo "✅ Test script completed!"
echo ""
echo "Next steps:"
echo "1. If API key is invalid, get one from: https://resend.com/api-keys"
echo "2. Set the key: export RESEND_API_KEY='your-key-here'"
echo "3. For production, add to Cloudflare: wrangler secret put RESEND_API_KEY"
echo ""