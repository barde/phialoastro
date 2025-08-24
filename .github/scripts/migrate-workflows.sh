#!/bin/bash

# Workflow Migration Script
# This script helps migrate from the old duplicate workflow structure
# to the new reusable workflow pattern.

set -e

echo "🚀 GitHub Actions Workflow Migration Script"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d ".github/workflows" ]; then
    echo -e "${RED}Error: Not in repository root. Please run from repository root.${NC}"
    exit 1
fi

echo "📋 Migration Checklist:"
echo ""

# Step 1: Backup existing workflows
echo "1. Creating backup of existing workflows..."
BACKUP_DIR=".github/workflows-backup-$(date +%Y%m%d-%H%M%S)"
cp -r .github/workflows "$BACKUP_DIR"
echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"
echo ""

# Step 2: Check for deprecated workflows
echo "2. Checking for deprecated workflows..."
DEPRECATED_WORKFLOWS=(
    "cloudflare-pr-preview-cached.yml"
    "deploy-master-cached.yml"
)

DEPRECATED_FOUND=()
for workflow in "${DEPRECATED_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        DEPRECATED_FOUND+=("$workflow")
        echo -e "${YELLOW}  ⚠ Found deprecated: $workflow${NC}"
    fi
done

if [ ${#DEPRECATED_FOUND[@]} -eq 0 ]; then
    echo -e "${GREEN}  ✓ No deprecated workflows found${NC}"
fi
echo ""

# Step 3: Check for deprecated actions
echo "3. Checking for deprecated actions..."
DEPRECATED_ACTIONS=(
    "setup-environment-cached"
    "build-astro-cached"
)

DEPRECATED_ACTIONS_FOUND=()
for action in "${DEPRECATED_ACTIONS[@]}"; do
    if [ -d ".github/actions/$action" ]; then
        DEPRECATED_ACTIONS_FOUND+=("$action")
        echo -e "${YELLOW}  ⚠ Found deprecated action: $action${NC}"
    fi
done

if [ ${#DEPRECATED_ACTIONS_FOUND[@]} -eq 0 ]; then
    echo -e "${GREEN}  ✓ No deprecated actions found${NC}"
fi
echo ""

# Step 4: Check for new required files
echo "4. Checking for new required files..."
REQUIRED_FILES=(
    ".github/workflows/deploy-reusable.yml"
    ".github/workflows/deploy-pr-preview.yml"
    ".github/workflows/deploy-master.yml"
    ".github/workflows/deploy-production.yml"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
        echo -e "${RED}  ✗ Missing required file: $file${NC}"
    else
        echo -e "${GREEN}  ✓ Found: $file${NC}"
    fi
done
echo ""

# Step 5: Validate consolidated actions
echo "5. Validating consolidated actions..."
CONSOLIDATED_ACTIONS=(
    ".github/actions/setup-environment/action.yml"
    ".github/actions/build-astro/action.yml"
    ".github/actions/deploy-worker/action.yml"
)

for action in "${CONSOLIDATED_ACTIONS[@]}"; do
    if [ -f "$action" ]; then
        # Check if action has cache parameters
        if grep -q "cache-version" "$action"; then
            echo -e "${GREEN}  ✓ $action has cache support${NC}"
        else
            echo -e "${YELLOW}  ⚠ $action may need cache parameter updates${NC}"
        fi
    else
        echo -e "${RED}  ✗ Missing action: $action${NC}"
    fi
done
echo ""

# Step 6: Update workflow references
echo "6. Checking for workflows that need updating..."
WORKFLOWS_TO_UPDATE=()

# Find workflows still using old patterns
for workflow in .github/workflows/*.yml; do
    if grep -q "setup-environment-cached\|build-astro-cached" "$workflow" 2>/dev/null; then
        WORKFLOWS_TO_UPDATE+=("$workflow")
        echo -e "${YELLOW}  ⚠ Needs update: $(basename $workflow)${NC}"
    fi
done

if [ ${#WORKFLOWS_TO_UPDATE[@]} -eq 0 ]; then
    echo -e "${GREEN}  ✓ All workflows using new actions${NC}"
fi
echo ""

# Step 7: Generate migration report
echo "📊 Migration Summary:"
echo "===================="
echo ""

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}Missing Required Files:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    echo ""
fi

if [ ${#DEPRECATED_FOUND[@]} -gt 0 ] || [ ${#DEPRECATED_ACTIONS_FOUND[@]} -gt 0 ]; then
    echo -e "${YELLOW}Files to Remove:${NC}"
    for file in "${DEPRECATED_FOUND[@]}"; do
        echo "  - .github/workflows/$file"
    done
    for action in "${DEPRECATED_ACTIONS_FOUND[@]}"; do
        echo "  - .github/actions/$action/"
    done
    echo ""
fi

if [ ${#WORKFLOWS_TO_UPDATE[@]} -gt 0 ]; then
    echo -e "${YELLOW}Workflows to Update:${NC}"
    for workflow in "${WORKFLOWS_TO_UPDATE[@]}"; do
        echo "  - $workflow"
        echo "    Replace: setup-environment-cached → setup-environment"
        echo "    Replace: build-astro-cached → build-astro"
    done
    echo ""
fi

# Step 8: Offer automated fixes
echo "🔧 Automated Fixes Available:"
echo "=============================="
echo ""

if [ ${#WORKFLOWS_TO_UPDATE[@]} -gt 0 ]; then
    echo "Would you like to automatically update workflow references? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        for workflow in "${WORKFLOWS_TO_UPDATE[@]}"; do
            echo "  Updating $workflow..."
            sed -i.bak 's/setup-environment-cached/setup-environment/g' "$workflow"
            sed -i.bak 's/build-astro-cached/build-astro/g' "$workflow"
            rm "${workflow}.bak"
        done
        echo -e "${GREEN}✓ Workflows updated${NC}"
    fi
    echo ""
fi

if [ ${#DEPRECATED_FOUND[@]} -gt 0 ] || [ ${#DEPRECATED_ACTIONS_FOUND[@]} -gt 0 ]; then
    echo "Would you like to remove deprecated files? (y/n)"
    echo -e "${YELLOW}Warning: Make sure new workflows are tested first!${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        for file in "${DEPRECATED_FOUND[@]}"; do
            echo "  Removing .github/workflows/$file..."
            rm ".github/workflows/$file"
        done
        for action in "${DEPRECATED_ACTIONS_FOUND[@]}"; do
            echo "  Removing .github/actions/$action/..."
            rm -rf ".github/actions/$action"
        done
        echo -e "${GREEN}✓ Deprecated files removed${NC}"
    fi
    echo ""
fi

# Step 9: Final recommendations
echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. Review the changes in a new branch:"
echo "   git checkout -b workflow-migration"
echo "   git add .github/"
echo "   git commit -m 'refactor: migrate to reusable workflow pattern'"
echo ""
echo "2. Test the new workflows:"
echo "   - Create a test PR to verify PR preview deployment"
echo "   - Run manual deployment to test staging"
echo "   - Monitor cache effectiveness in PR comments"
echo ""
echo "3. Performance validation:"
echo "   - Check cache hit rates (target >66%)"
echo "   - Verify build times (<2 minutes)"
echo "   - Monitor deployment success rate"
echo ""
echo "4. Clean up after successful migration:"
echo "   - Remove backup directory: $BACKUP_DIR"
echo "   - Update team documentation"
echo "   - Notify team of changes"
echo ""
echo -e "${GREEN}✅ Migration preparation complete!${NC}"
echo ""
echo "For more information, see: .github/workflows/README.md"