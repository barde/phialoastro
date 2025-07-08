#!/bin/bash

# Test Resend email integration for Phialo Design contact form
echo "========================================"
echo "Testing Resend Email Integration"
echo "========================================"

# Configuration
API_URL="${API_URL:-http://localhost:8787}"
ENDPOINT="/api/contact"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        success) echo -e "${GREEN}✓${NC} $message" ;;
        error) echo -e "${RED}✗${NC} $message" ;;
        info) echo -e "${YELLOW}ℹ${NC} $message" ;;
    esac
}

# Check if the worker is running
print_status info "Checking if worker is running at $API_URL..."
if ! curl -s -o /dev/null -w "%{http_code}" "$API_URL" | grep -q "200\|404"; then
    print_status error "Worker is not running at $API_URL"
    print_status info "Please start the worker with: npm run dev"
    exit 1
fi
print_status success "Worker is running"

# Test data
EMAIL_DATA='{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "+49 123 456789",
  "subject": "Test Email from Resend Integration",
  "message": "This is a test message from the Resend email integration test script.\n\nIf you receive this email, the integration is working correctly!",
  "language": "en"
}'

# Send test email
print_status info "Sending test email via Resend..."
echo ""
echo "Request Data:"
echo "$EMAIL_DATA" | jq '.'
echo ""

RESPONSE=$(curl -s -X POST "$API_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8787" \
  -d "$EMAIL_DATA")

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8787" \
  -d "$EMAIL_DATA")

echo "Response Status: $HTTP_CODE"
echo "Response Body:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Check response
if [[ "$HTTP_CODE" == "200" ]] && echo "$RESPONSE" | grep -q '"success":true'; then
    print_status success "Email sent successfully!"
    
    # Extract message from response
    MESSAGE=$(echo "$RESPONSE" | jq -r '.message' 2>/dev/null)
    if [ -n "$MESSAGE" ]; then
        print_status info "Server message: $MESSAGE"
    fi
    
    # Check for any warnings
    WARNING=$(echo "$RESPONSE" | jq -r '.warning' 2>/dev/null)
    if [ -n "$WARNING" ] && [ "$WARNING" != "null" ]; then
        print_status info "Warning: $WARNING"
    fi
else
    print_status error "Failed to send email"
    
    # Extract error message
    ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null)
    if [ -n "$ERROR" ] && [ "$ERROR" != "null" ]; then
        print_status error "Error: $ERROR"
    fi
    
    # Extract error details
    DETAILS=$(echo "$RESPONSE" | jq -r '.details' 2>/dev/null)
    if [ -n "$DETAILS" ] && [ "$DETAILS" != "null" ]; then
        print_status error "Details: $DETAILS"
    fi
fi

echo ""
echo "========================================"
echo "Test completed"
echo "========================================"

# Additional information
echo ""
print_status info "Next steps:"
echo "  1. Check the configured TO_EMAIL inbox for the notification email"
echo "  2. Check the test email address (test@example.com) for the confirmation email"
echo "  3. Check the worker logs for any errors: npm run logs"
echo ""
print_status info "To test with different data, modify the EMAIL_DATA variable in this script"
print_status info "To test in German, change 'language' to 'de' in the request"