#!/bin/bash

# Email test script for worker-mailer
# Usage: ./run-email-test.sh email1@example.com email2@example.com

echo "Worker Mailer Email Test"
echo "========================"

# Check if email addresses are provided
if [ $# -lt 1 ]; then
    echo "Usage: $0 <test-email-address> [to-email-address]"
    echo "Example: $0 test@example.com info@phialo.de"
    exit 1
fi

TEST_EMAIL=$1
TO_EMAIL=${2:-"info@phialo.de"}

echo "Test will send emails to:"
echo "  - Direct test: $TEST_EMAIL"
echo "  - Contact form notification: $TO_EMAIL"
echo "  - Contact form confirmation: $TEST_EMAIL"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKERS_DIR="$SCRIPT_DIR/../workers"

# Change to workers directory to access node_modules
cd "$WORKERS_DIR"

# Run the test with environment variables
TEST_EMAIL="$TEST_EMAIL" TO_EMAIL="$TO_EMAIL" npx tsx "$SCRIPT_DIR/test-worker-mailer.ts"