#!/bin/bash

# Simple script to send test email via the deployed worker

echo "Sending test email to: $1"
echo ""

curl -X POST https://phialo-design-preview.meise.workers.dev/api/contact \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"$1\",
    \"subject\": \"Test Email from Phialo Worker\",
    \"message\": \"This is a test email sent through the deployed Cloudflare Worker to verify the email system is working.\",
    \"language\": \"en\"
  }" | jq

echo ""
echo "Check the email inbox for:"
echo "- Notification at: info@phialo.de (or configured TO_EMAIL)"
echo "- Confirmation at: $1"