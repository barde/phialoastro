#!/bin/bash

# Script to set up GitHub repository secrets for email service
# This script uses the GitHub CLI to add the required secrets

set -e

echo "Email Service Secrets Setup"
echo "=========================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install it with: brew install gh (macOS) or see https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "This script will set up the following GitHub secrets:"
echo "  - RESEND_API_KEY: Your Resend API key"
echo "  - FROM_EMAIL: Email sender address"
echo "  - TO_EMAIL: Email recipient address"
echo ""

# Confirm before proceeding
read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Setting up secrets..."

# Set RESEND_API_KEY
echo ""
echo "Enter your Resend API key (starts with re_):"
echo "Get it from: https://resend.com/api-keys"
read -s -p "RESEND_API_KEY: " RESEND_KEY
echo
if [[ -z "$RESEND_KEY" ]]; then
    echo "Error: API key cannot be empty"
    exit 1
fi
echo "$RESEND_KEY" | gh secret set RESEND_API_KEY
echo "✓ RESEND_API_KEY set"

# Set FROM_EMAIL
echo ""
echo "Enter the sender email address."
echo "For testing, you can use: onboarding@resend.dev"
echo "For production, use your verified domain email (e.g., noreply@phialo.de)"
read -p "FROM_EMAIL [onboarding@resend.dev]: " FROM_EMAIL_INPUT
FROM_EMAIL="${FROM_EMAIL_INPUT:-onboarding@resend.dev}"
echo "$FROM_EMAIL" | gh secret set FROM_EMAIL
echo "✓ FROM_EMAIL set to: $FROM_EMAIL"

# Set TO_EMAIL
echo ""
echo "Enter the recipient email address for contact form submissions."
read -p "TO_EMAIL [info@phialo.de]: " TO_EMAIL_INPUT
TO_EMAIL="${TO_EMAIL_INPUT:-info@phialo.de}"
echo "$TO_EMAIL" | gh secret set TO_EMAIL
echo "✓ TO_EMAIL set to: $TO_EMAIL"

echo ""
echo "✅ Secrets successfully configured!"
echo ""
echo "Verifying secrets..."
gh secret list | grep -E "RESEND_API_KEY|FROM_EMAIL|TO_EMAIL" || true

echo ""
echo "Next steps:"
echo "1. Push to a PR to trigger a new deployment"
echo "2. Test the contact form on the PR preview URL"
echo "3. Check that emails are being received at: $TO_EMAIL"
echo ""
echo "Optional: Add TURNSTILE_SECRET_KEY for CAPTCHA protection"
echo "  gh secret set TURNSTILE_SECRET_KEY"