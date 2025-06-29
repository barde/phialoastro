#!/bin/bash

# Phialo Design Deployment Script
# This script provides an easy way to trigger manual deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="preview"
BRANCH=""
SKIP_TESTS=false
METHOD="cli"

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Deployment environment (preview|production) [default: preview]"
    echo "  -b, --branch BRANCH      Branch to deploy [default: current branch]"
    echo "  -s, --skip-tests         Skip tests before deployment"
    echo "  -m, --method METHOD      Deployment method (cli|gh|api) [default: cli]"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Methods:"
    echo "  cli - Direct wrangler deployment (requires local setup)"
    echo "  gh  - GitHub Actions deployment (requires gh CLI)"
    echo "  api - API webhook deployment (requires GITHUB_TOKEN)"
    echo ""
    echo "Examples:"
    echo "  $0                              # Deploy current branch to preview"
    echo "  $0 -e production -b master      # Deploy master to production"
    echo "  $0 -m gh -e preview             # Deploy using GitHub Actions"
    echo "  $0 -m api -e production -s      # Deploy using API, skip tests"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -m|--method)
            METHOD="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "preview" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'. Must be 'preview' or 'production'${NC}"
    exit 1
fi

# Get current branch if not specified
if [ -z "$BRANCH" ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

# Show deployment info
echo -e "${BLUE}=== Phialo Design Deployment ===${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Branch: ${YELLOW}$BRANCH${NC}"
echo -e "Skip Tests: ${YELLOW}$SKIP_TESTS${NC}"
echo -e "Method: ${YELLOW}$METHOD${NC}"
echo ""

# Confirm production deployments
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${RED}⚠️  WARNING: You are about to deploy to PRODUCTION!${NC}"
    echo -e "Branch: ${YELLOW}$BRANCH${NC}"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}Deployment cancelled.${NC}"
        exit 0
    fi
fi

# Function to deploy using CLI
deploy_cli() {
    echo -e "${BLUE}Deploying using Wrangler CLI...${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "phialo-design/package.json" ]; then
        echo -e "${RED}Error: Must run from repository root directory${NC}"
        exit 1
    fi
    
    # Build the site
    echo -e "${BLUE}Building Astro site...${NC}"
    cd phialo-design
    npm run build
    
    # Deploy
    echo -e "${BLUE}Deploying to Cloudflare Workers...${NC}"
    cd ../workers
    
    if [ "$ENVIRONMENT" = "production" ]; then
        npm run deploy:production
    else
        npm run deploy:preview
    fi
    
    # Show success message
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "URL: ${YELLOW}https://phialo.de${NC}"
    else
        echo -e "URL: ${YELLOW}https://phialo-design-preview.meise.workers.dev${NC}"
    fi
}

# Function to deploy using GitHub Actions
deploy_gh() {
    echo -e "${BLUE}Deploying using GitHub Actions...${NC}"
    
    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
        echo "Install it from: https://cli.github.com/"
        exit 1
    fi
    
    # Trigger workflow
    echo -e "${BLUE}Triggering workflow...${NC}"
    gh workflow run manual-deploy.yml \
        -f environment="$ENVIRONMENT" \
        -f branch="$BRANCH" \
        -f skip_tests="$SKIP_TESTS"
    
    # Get the run ID
    sleep 2
    RUN_ID=$(gh run list --workflow=manual-deploy.yml --limit 1 --json databaseId -q '.[0].databaseId')
    
    if [ -n "$RUN_ID" ]; then
        echo -e "${GREEN}Workflow started: Run ID $RUN_ID${NC}"
        echo -e "View progress: ${YELLOW}gh run watch $RUN_ID${NC}"
        echo -e "View in browser: ${YELLOW}https://github.com/barde/phialoastro/actions/runs/$RUN_ID${NC}"
        
        # Ask if user wants to watch
        read -p "Watch deployment progress? (y/n): " watch
        if [ "$watch" = "y" ]; then
            gh run watch "$RUN_ID"
        fi
    else
        echo -e "${YELLOW}Workflow triggered. Check GitHub Actions for status.${NC}"
    fi
}

# Function to deploy using API
deploy_api() {
    echo -e "${BLUE}Deploying using GitHub API...${NC}"
    
    # Check for GitHub token
    if [ -z "$GITHUB_TOKEN" ]; then
        echo -e "${RED}Error: GITHUB_TOKEN environment variable not set${NC}"
        echo "Generate a token at: https://github.com/settings/tokens"
        exit 1
    fi
    
    # Prepare event type
    EVENT_TYPE="deploy-preview"
    if [ "$ENVIRONMENT" = "production" ]; then
        EVENT_TYPE="deploy-production"
    fi
    
    # Make API request
    echo -e "${BLUE}Sending deployment request...${NC}"
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Content-Type: application/json" \
        -d "{
            \"event_type\": \"$EVENT_TYPE\",
            \"client_payload\": {
                \"branch\": \"$BRANCH\"
            }
        }" \
        https://api.github.com/repos/barde/phialoastro/dispatches \
        -w "\n%{http_code}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "204" ]; then
        echo -e "${GREEN}✅ Deployment triggered successfully!${NC}"
        echo -e "Check progress at: ${YELLOW}https://github.com/barde/phialoastro/actions${NC}"
    else
        echo -e "${RED}Error: Failed to trigger deployment (HTTP $HTTP_CODE)${NC}"
        echo "$RESPONSE" | head -n-1
        exit 1
    fi
}

# Execute deployment based on method
case $METHOD in
    cli)
        deploy_cli
        ;;
    gh)
        deploy_gh
        ;;
    api)
        deploy_api
        ;;
    *)
        echo -e "${RED}Error: Invalid method '$METHOD'${NC}"
        exit 1
        ;;
esac