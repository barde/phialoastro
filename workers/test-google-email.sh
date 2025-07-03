#!/bin/bash

# Test Google Workspace email setup
echo "Testing Google Workspace Email Configuration..."
echo ""

# Make sure you have the worker running locally first
echo "Sending test email..."
curl -X POST http://localhost:8787/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+49 123 456789",
    "subject": "Test Email - Google Workspace Integration",
    "message": "This is a test email sent using Google Workspace Gmail API with service account domain-wide delegation.",
    "language": "en",
    "sendCopy": true
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n" | jq .

echo ""
echo "If you see a success message with a messageId, your Google Workspace email is configured correctly!"
echo "If not, check:"
echo "1. Service account key is valid JSON"
echo "2. Domain-wide delegation is authorized in Google Admin"
echo "3. Gmail API is enabled in Google Cloud Console"
echo "4. GOOGLE_DELEGATED_EMAIL is an actual user in your Google Workspace"