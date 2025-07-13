#!/bin/bash

# Script to check GitHub environment configuration
set -e

echo "GitHub Environment Configuration Check"
echo "======================================"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install it with: brew install gh (macOS) or see https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Get repository info
REPO_INFO=$(gh repo view --json name,owner)
REPO_NAME=$(echo $REPO_INFO | jq -r '.name')
REPO_OWNER=$(echo $REPO_INFO | jq -r '.owner.login')

echo "Repository: $REPO_OWNER/$REPO_NAME"
echo ""

# Check for environments
echo "Checking for GitHub Environments..."
echo "-----------------------------------"

# List environments (using API since gh doesn't have direct command)
ENVIRONMENTS=$(gh api repos/$REPO_OWNER/$REPO_NAME/environments --jq '.environments[] | .name' 2>/dev/null || echo "")

if [ -z "$ENVIRONMENTS" ]; then
    echo "❌ No environments found"
    echo ""
    echo "To create environments:"
    echo "1. Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings/environments"
    echo "2. Click 'New environment'"
    echo "3. Create 'preview' and 'production' environments"
else
    echo "✅ Found environments:"
    echo "$ENVIRONMENTS" | while read env; do
        echo "   - $env"
    done
fi

echo ""

# Check repository secrets
echo "Checking Repository-Level Secrets..."
echo "-----------------------------------"
REPO_SECRETS=$(gh secret list | awk '{print $1}')

echo "Repository secrets:"
echo "$REPO_SECRETS" | while read secret; do
    echo "   - $secret"
done

echo ""

# Check if email secrets are at repository level (they shouldn't be)
EMAIL_SECRETS=("RESEND_API_KEY" "FROM_EMAIL" "TO_EMAIL")
FOUND_AT_REPO_LEVEL=false

for secret in "${EMAIL_SECRETS[@]}"; do
    if echo "$REPO_SECRETS" | grep -q "^$secret$"; then
        echo "⚠️  Warning: $secret is at repository level (should be in environments)"
        FOUND_AT_REPO_LEVEL=true
    fi
done

if [ "$FOUND_AT_REPO_LEVEL" = true ]; then
    echo ""
    echo "📌 Recommendation: Move email secrets to environment level for better security"
fi

echo ""

# Check workflow files
echo "Checking Workflow Configuration..."
echo "---------------------------------"

WORKFLOW_FILES=$(find .github/workflows -name "*.yml" -o -name "*.yaml" 2>/dev/null || echo "")

if [ -n "$WORKFLOW_FILES" ]; then
    echo "Checking for environment usage in workflows:"
    
    echo "$WORKFLOW_FILES" | while read workflow; do
        if grep -q "environment:" "$workflow" 2>/dev/null; then
            ENV_NAME=$(grep -A1 "environment:" "$workflow" | tail -1 | sed 's/.*: //' | tr -d ' "')
            echo "✅ $(basename $workflow) uses environment: $ENV_NAME"
        else
            # Check if it's a deployment workflow
            if grep -q "deploy\|cloudflare" "$workflow" 2>/dev/null; then
                echo "⚠️  $(basename $workflow) deploys but doesn't specify environment"
            fi
        fi
    done
fi

echo ""

# Provide recommendations
echo "Recommendations"
echo "==============="
echo ""

if [ -z "$ENVIRONMENTS" ]; then
    echo "1. Create GitHub Environments:"
    echo "   - preview (for PR deployments)"
    echo "   - production (for main branch deployments)"
    echo ""
fi

if [ "$FOUND_AT_REPO_LEVEL" = true ]; then
    echo "2. Move secrets to environment level:"
    echo "   - Remove from repository secrets"
    echo "   - Add to appropriate environments"
    echo ""
fi

echo "3. Environment best practices:"
echo "   - Use different API keys for preview vs production"
echo "   - Enable protection rules for production"
echo "   - Require approval for production deployments"
echo ""

echo "For detailed setup instructions, see:"
echo "docs/how-to/setup-github-environments.md"