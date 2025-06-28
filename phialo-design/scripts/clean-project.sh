#!/bin/bash

# Clean Project Script
# This script removes all junk files and empty directories to maintain a clean project structure

echo "🧹 Starting project cleanup..."

# Remove .DS_Store files
echo "Removing .DS_Store files..."
find . -name ".DS_Store" -type f -delete

# Remove other system junk files
echo "Removing other system files..."
find . -type f \( \
    -name "Thumbs.db" \
    -o -name "._*" \
    -o -name ".Spotlight-V100" \
    -o -name ".Trashes" \
    -o -name "ehthumbs.db" \
    -o -name "desktop.ini" \
    -o -name "*.swp" \
    -o -name "*.swo" \
    -o -name "*~" \
\) -not -path "./node_modules/*" -not -path "./.git/*" -delete

# Remove empty directories (excluding node_modules and .git)
echo "Removing empty directories..."
find . -type d -empty -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./build/*" -delete

# Report on potentially problematic files
echo ""
echo "📊 Cleanup Summary:"
echo "-------------------"

# Check for any remaining log files outside node_modules
LOG_FILES=$(find . -type f -name "*.log" -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | wc -l)
if [ "$LOG_FILES" -gt 0 ]; then
    echo "⚠️  Found $LOG_FILES log files outside node_modules:"
    find . -type f -name "*.log" -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null
fi

# Check for backup files
BACKUP_FILES=$(find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.old" -o -name "*.orig" \) -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | wc -l)
if [ "$BACKUP_FILES" -gt 0 ]; then
    echo "⚠️  Found $BACKUP_FILES backup files:"
    find . -type f \( -name "*.bak" -o -name "*.backup" -o -name "*.old" -o -name "*.orig" \) -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null
fi

# Check for archive files
ARCHIVE_FILES=$(find . -type f \( -name "*.zip" -o -name "*.tar" -o -name "*.gz" -o -name "*.rar" \) -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | wc -l)
if [ "$ARCHIVE_FILES" -gt 0 ]; then
    echo "⚠️  Found $ARCHIVE_FILES archive files:"
    find . -type f \( -name "*.zip" -o -name "*.tar" -o -name "*.gz" -o -name "*.rar" \) -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null
fi

echo ""
echo "✅ Cleanup complete!"