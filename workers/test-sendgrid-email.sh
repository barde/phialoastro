#!/bin/bash

# Test script for SendGrid email provider
# Usage: ./test-sendgrid-email.sh

set -e

echo "🧪 Testing SendGrid Email Provider"
echo "=================================="

# Check if .dev.vars exists
if [ ! -f ".dev.vars" ]; then
    echo "❌ Error: .dev.vars file not found"
    echo "Please create .dev.vars with:"
    echo "SENDGRID_API_KEY=your_sendgrid_api_key"
    echo "FROM_EMAIL=noreply@phialo.de"
    echo "TO_EMAIL=info@phialo.de"
    exit 1
fi

# Extract SendGrid API key from .dev.vars
SENDGRID_API_KEY=$(grep SENDGRID_API_KEY .dev.vars | cut -d '=' -f2- | tr -d '"' | tr -d ' ')

if [ -z "$SENDGRID_API_KEY" ]; then
    echo "❌ Error: SENDGRID_API_KEY not found in .dev.vars"
    exit 1
fi

# Test API key validity by checking rate limit endpoint
echo "📋 Checking API key validity..."
RATE_LIMIT_RESPONSE=$(curl -s -X GET "https://api.sendgrid.com/v3/scopes" \
    -H "Authorization: Bearer $SENDGRID_API_KEY" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RATE_LIMIT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RATE_LIMIT_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ API key is valid"
    echo "📊 Available scopes:"
    echo "$RESPONSE_BODY" | jq -r '.scopes[]' 2>/dev/null || echo "$RESPONSE_BODY"
else
    echo "❌ API key validation failed (HTTP $HTTP_CODE)"
    echo "$RESPONSE_BODY"
    exit 1
fi

# Test sending email through the worker
echo ""
echo "📧 Testing email send through worker API..."

# Start the worker in the background
echo "Starting worker..."
npm run dev > worker.log 2>&1 &
WORKER_PID=$!

# Wait for worker to start
sleep 5

# Check if worker is running
if ! ps -p $WORKER_PID > /dev/null; then
    echo "❌ Worker failed to start. Check worker.log for details"
    cat worker.log
    exit 1
fi

# Prepare test data
TEST_DATA='{
  "name": "SendGrid Test",
  "email": "test@example.com",
  "subject": "Test Email from SendGrid",
  "message": "This is a test email sent through SendGrid to verify the email service is working correctly.",
  "language": "en",
  "sendCopy": false
}'

# Send test request
echo "Sending test email..."
RESPONSE=$(curl -s -X POST http://localhost:8787/api/contact \
    -H "Content-Type: application/json" \
    -d "$TEST_DATA" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n-1)

# Kill the worker
kill $WORKER_PID 2>/dev/null || true

echo ""
echo "Response Code: $HTTP_CODE"
echo "Response Body: $RESPONSE_BODY"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo ""
    echo "✅ Email sent successfully!"
    echo ""
    echo "📬 Check your inbox at the TO_EMAIL address configured in .dev.vars"
    echo "   The email should arrive within a few minutes."
else
    echo ""
    echo "❌ Email send failed"
    echo ""
    echo "Common issues:"
    echo "1. Check that FROM_EMAIL is verified in SendGrid"
    echo "2. Ensure TO_EMAIL is a valid email address"
    echo "3. Check worker.log for detailed error messages"
fi

# Cleanup
rm -f worker.log

echo ""
echo "📋 SendGrid Dashboard Links:"
echo "   - Activity Feed: https://app.sendgrid.com/email_activity"
echo "   - API Keys: https://app.sendgrid.com/settings/api_keys"
echo "   - Sender Verification: https://app.sendgrid.com/settings/sender_auth"