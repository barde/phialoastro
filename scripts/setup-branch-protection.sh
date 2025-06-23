#!/bin/bash

# Branch Protection Setup Script for Phialo Design
# This script configures branch protection rules for the master branch

set -e

echo "🔐 Setting up branch protection for master branch..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📦 Repository: $REPO"

# Function to enable branch protection
enable_protection() {
    echo "✅ Enabling branch protection on master..."
    
    # Create branch protection rule
    gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "/repos/$REPO/branches/master/protection" \
        -f required_status_checks='{"strict":true,"contexts":["Test Summary"]}' \
        -f enforce_admins=false \
        -f required_pull_request_reviews='{"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"required_approving_review_count":0}' \
        -f restrictions=null \
        -f allow_force_pushes=false \
        -f allow_deletions=false \
        -f required_conversation_resolution=false \
        -f lock_branch=false \
        -f allow_fork_syncing=true \
        -f required_linear_history=false
    
    echo "✅ Branch protection enabled successfully!"
    echo ""
    echo "📋 Protection settings:"
    echo "  - Pull requests required before merging"
    echo "  - Status checks must pass (Test Summary)"
    echo "  - Branches must be up to date before merging"
    echo "  - Stale reviews dismissed on new commits"
    echo "  - Force pushes blocked"
    echo "  - Branch deletion blocked"
}

# Function to disable branch protection
disable_protection() {
    echo "🔓 Disabling branch protection on master..."
    
    gh api \
        --method DELETE \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "/repos/$REPO/branches/master/protection" || true
    
    echo "✅ Branch protection disabled"
}

# Function to check current protection status
check_status() {
    echo "🔍 Checking current branch protection status..."
    
    if gh api "/repos/$REPO/branches/master/protection" &> /dev/null; then
        echo "✅ Branch protection is currently ENABLED"
        
        # Get detailed status
        gh api "/repos/$REPO/branches/master/protection" | jq '{
            required_status_checks: .required_status_checks.contexts,
            enforce_admins: .enforce_admins.enabled,
            dismiss_stale_reviews: .required_pull_request_reviews.dismiss_stale_reviews,
            required_approving_review_count: .required_pull_request_reviews.required_approving_review_count
        }'
    else
        echo "❌ Branch protection is currently DISABLED"
    fi
}

# Main menu
case "${1:-enable}" in
    enable)
        enable_protection
        ;;
    disable)
        disable_protection
        ;;
    status)
        check_status
        ;;
    *)
        echo "Usage: $0 [enable|disable|status]"
        echo ""
        echo "Commands:"
        echo "  enable   - Enable branch protection (default)"
        echo "  disable  - Disable branch protection"
        echo "  status   - Check current protection status"
        exit 1
        ;;
esac

echo ""
echo "🎉 Done!"