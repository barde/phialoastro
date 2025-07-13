#!/bin/bash

# Script to migrate existing image files to Git LFS
# This script helps with the migration process described in issue #230

set -e

echo "=== Git LFS Migration Helper Script ==="
echo "This script will help you migrate image files to Git LFS"
echo ""

# Check if git lfs is installed
if ! command -v git-lfs &> /dev/null; then
    echo "❌ Error: Git LFS is not installed!"
    echo "Please install it first:"
    echo "  brew install git-lfs  # macOS"
    echo "  sudo apt-get install git-lfs  # Ubuntu/Debian"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository!"
    exit 1
fi

echo "✅ Git LFS is installed"
echo ""

# Show current status
echo "📊 Current Status:"
echo "- Total image files: $(find . -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \) -not -path "./node_modules/*" -not -path "./.git/*" | wc -l | tr -d ' ')"
echo "- Files tracked by LFS: $(git lfs ls-files | wc -l | tr -d ' ')"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes!"
    echo "It's recommended to commit or stash your changes before migrating to LFS."
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🔍 Migration Options:"
echo "1. Migrate ALL image files to LFS (rewrites history - requires force push)"
echo "2. Track future image files with LFS (no history rewrite)"
echo "3. Show commands only (dry run)"
echo ""
read -p "Select option (1-3): " option

case $option in
    1)
        echo ""
        echo "⚠️  WARNING: This will rewrite git history!"
        echo "All team members will need to re-clone the repository."
        echo ""
        read -p "Are you sure you want to proceed? Type 'yes' to confirm: " confirm
        if [ "$confirm" != "yes" ]; then
            echo "Migration cancelled."
            exit 0
        fi
        
        echo ""
        echo "📦 Starting migration..."
        echo "This may take a while for large repositories..."
        
        # Migrate existing files in history
        git lfs migrate import --include="*.jpg,*.png,*.webp" --everything
        
        echo ""
        echo "✅ Migration complete!"
        echo ""
        echo "Next steps:"
        echo "1. Review the changes: git log --oneline -n 10"
        echo "2. Force push to remote: git push --force-with-lease origin $(git branch --show-current)"
        echo "3. Notify all team members to re-clone the repository"
        ;;
        
    2)
        echo ""
        echo "📦 Tracking future files with LFS..."
        
        # Track the files with LFS
        git lfs track "*.jpg"
        git lfs track "*.png"
        git lfs track "*.webp"
        
        # Add and commit .gitattributes
        git add .gitattributes
        git commit -m "Configure Git LFS tracking for image files"
        
        echo ""
        echo "✅ LFS tracking configured!"
        echo "Future image files will be stored in LFS."
        echo ""
        echo "To convert existing files, you'll need to:"
        echo "1. Remove them: git rm --cached *.jpg *.png *.webp"
        echo "2. Re-add them: git add *.jpg *.png *.webp"
        echo "3. Commit: git commit -m 'Migrate images to LFS'"
        ;;
        
    3)
        echo ""
        echo "📝 Dry run - here are the commands that would be executed:"
        echo ""
        echo "# For full migration (option 1):"
        echo "git lfs migrate import --include=\"*.jpg,*.png,*.webp\" --everything"
        echo "git push --force-with-lease origin $(git branch --show-current)"
        echo ""
        echo "# For tracking future files (option 2):"
        echo "git lfs track \"*.jpg\""
        echo "git lfs track \"*.png\""
        echo "git lfs track \"*.webp\""
        echo "git add .gitattributes"
        echo "git commit -m \"Configure Git LFS tracking for image files\""
        ;;
        
    *)
        echo "Invalid option selected."
        exit 1
        ;;
esac

echo ""
echo "📚 Additional Resources:"
echo "- Git LFS Tutorial: https://github.com/git-lfs/git-lfs/wiki/Tutorial"
echo "- Issue #230: https://github.com/barde/phialoastro/issues/230"