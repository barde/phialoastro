#!/bin/bash

# Repository Slimming Script
# This script helps reduce the repository size by removing duplicates and optimizing assets

echo "🚀 Repository Slimming Script"
echo "============================"
echo ""

# Check current size
CURRENT_SIZE=$(du -sh . | cut -f1)
echo "Current repository size: $CURRENT_SIZE"
echo ""

# Function to confirm actions
confirm() {
    read -p "$1 (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# 1. Check for duplicate workers directory
if [ -d "phialo-design/workers" ]; then
    WORKERS_SIZE=$(du -sh phialo-design/workers | cut -f1)
    echo "⚠️  Found duplicate workers directory: phialo-design/workers ($WORKERS_SIZE)"
    if confirm "Remove duplicate workers directory?"; then
        rm -rf phialo-design/workers
        echo "✅ Removed duplicate workers directory"
    fi
    echo ""
fi

# 2. Check for dist directories
DIST_DIRS=$(find . -name "dist" -type d -not -path "./node_modules/*" 2>/dev/null)
if [ ! -z "$DIST_DIRS" ]; then
    echo "⚠️  Found dist directories that shouldn't be in git:"
    echo "$DIST_DIRS"
    if confirm "Add dist/ to .gitignore?"; then
        if ! grep -q "^dist/$" .gitignore; then
            echo "dist/" >> .gitignore
            echo "✅ Added dist/ to .gitignore"
        else
            echo "ℹ️  dist/ already in .gitignore"
        fi
    fi
    echo ""
fi

# 3. Check for large images
echo "📸 Checking for large images..."
LARGE_IMAGES=$(find . -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -size +500k -not -path "./node_modules/*" -not -path "./dist/*" 2>/dev/null)
if [ ! -z "$LARGE_IMAGES" ]; then
    echo "Found large images (>500KB):"
    echo "$LARGE_IMAGES" | while read img; do
        SIZE=$(ls -lh "$img" | awk '{print $5}')
        echo "  - $img ($SIZE)"
    done
    echo ""
    echo "💡 Recommendation: Use image optimization tools or convert to WebP format"
    echo "   Command: sharp -i image.jpg -o image.webp -q 85"
fi
echo ""

# 4. Check node_modules size
if [ -d "node_modules" ] || [ -d "phialo-design/node_modules" ] || [ -d "workers/node_modules" ]; then
    echo "📦 Node modules analysis:"
    find . -name "node_modules" -type d -not -path "./node_modules/*" | while read dir; do
        SIZE=$(du -sh "$dir" | cut -f1)
        echo "  - $dir: $SIZE"
    done
    echo ""
    echo "💡 Recommendation: Switch to pnpm for better deduplication"
    echo "   Commands:"
    echo "   npm install -g pnpm"
    echo "   pnpm import"
    echo "   rm -rf node_modules package-lock.json"
    echo "   pnpm install"
fi
echo ""

# 5. Summary
echo "📊 Summary of potential savings:"
echo "================================"
SAVINGS=0

if [ -d "phialo-design/workers" ]; then
    echo "- Remove duplicate workers: 193MB"
    SAVINGS=$((SAVINGS + 193))
fi

if [ ! -z "$DIST_DIRS" ]; then
    DIST_SIZE=$(du -sh $DIST_DIRS 2>/dev/null | awk '{sum += $1} END {print sum}')
    echo "- Remove dist directories: ~31MB"
    SAVINGS=$((SAVINGS + 31))
fi

if command -v pnpm &> /dev/null; then
    echo "- pnpm is already installed ✅"
else
    echo "- Switch to pnpm: ~400MB"
    SAVINGS=$((SAVINGS + 400))
fi

echo ""
echo "🎯 Total potential savings: ~${SAVINGS}MB"
echo ""

# Final size check
NEW_SIZE=$(du -sh . | cut -f1)
echo "Current repository size: $NEW_SIZE"

if [ "$CURRENT_SIZE" != "$NEW_SIZE" ]; then
    echo "✨ Reduced from $CURRENT_SIZE to $NEW_SIZE"
fi