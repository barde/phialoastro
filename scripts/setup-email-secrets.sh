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
echo "  - FROM_EMAIL: onboarding@resend.dev (Resend's test email)"
echo "  - TO_EMAIL: info@phialo.de (or your specified email)"
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
echo "Setting RESEND_API_KEY..."
echo "re_DjjVqEAU_Gah8NgnkVfVaccLBhRSLCoj9" | gh secret set RESEND_API_KEY

# Set FROM_EMAIL
echo "Setting FROM_EMAIL..."
echo "onboarding@resend.dev" | gh secret set FROM_EMAIL

# Set TO_EMAIL
echo ""
echo "For TO_EMAIL, you can use:"
echo "  1. info@phialo.de (default)"
echo "  2. Your own email address"
echo ""
read -p "Enter the recipient email [info@phialo.de]: " TO_EMAIL_INPUT
TO_EMAIL="${TO_EMAIL_INPUT:-info@phialo.de}"
echo "$TO_EMAIL" | gh secret set TO_EMAIL

echo ""
echo "✅ Secrets successfully configured!"
echo ""
echo "Verifying secrets..."
gh secret list | grep -E "RESEND_API_KEY|FROM_EMAIL|TO_EMAIL" || true

echo ""
echo "Next steps:"
echo "1. Push to a PR to trigger a new deployment"
echo "2. Test the contact form on the PR preview URL"
echo "3. Check that emails are being received"
echo ""
echo "For production deployment, you may want to:"
echo "- Change FROM_EMAIL to a verified domain email (e.g., noreply@phialo.de)"
echo "- Add TURNSTILE_SECRET_KEY for CAPTCHA protection"