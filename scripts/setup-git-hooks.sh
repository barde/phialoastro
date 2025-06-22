#!/bin/bash

# Script to set up git hooks for preventing unwanted files

echo "🚀 Setting up Git hooks to prevent unwanted files..."

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
echo "${BLUE}Creating pre-commit hook...${NC}"
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh

# Check for large files
MAX_FILE_SIZE=5242880  # 5MB in bytes

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "Running pre-commit checks..."

# Check for prohibited file types
PROHIBITED_PATTERNS="\.zip$|\.tar$|\.tar\.gz$|\.tgz$|\.rar$|\.7z$|\.exe$|\.dll$|\.so$|\.dylib$|\.dmg$|\.iso$"

prohibited_files=$(git diff --cached --name-only | grep -E "$PROHIBITED_PATTERNS")
if [ -n "$prohibited_files" ]; then
    echo "${RED}❌ Commit blocked: Found prohibited file types:${NC}"
    echo "$prohibited_files"
    echo "${YELLOW}Please remove these files from your commit.${NC}"
    exit 1
fi

# Check for large files
large_files=""
for file in $(git diff --cached --name-only); do
    if [ -f "$file" ]; then
        file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [ "$file_size" -gt "$MAX_FILE_SIZE" ]; then
            size_mb=$((file_size / 1048576))
            large_files="${large_files}${file} (${size_mb}MB)\n"
        fi
    fi
done

if [ -n "$large_files" ]; then
    echo "${RED}❌ Commit blocked: Found files larger than 5MB:${NC}"
    echo -e "$large_files"
    echo "${YELLOW}Consider using Git LFS for large files or exclude them from the repository.${NC}"
    exit 1
fi

# Check for sensitive patterns
SENSITIVE_PATTERNS="password=|api_key=|secret=|private_key|BEGIN RSA|BEGIN DSA|BEGIN EC|BEGIN OPENSSH|BEGIN PGP"
sensitive_files=$(git diff --cached --name-only -z | xargs -0 grep -l -E -i "$SENSITIVE_PATTERNS" 2>/dev/null)

if [ -n "$sensitive_files" ]; then
    echo "${YELLOW}⚠️  Warning: Potential sensitive information detected in:${NC}"
    echo "$sensitive_files"
    echo "${YELLOW}Please review these files before committing.${NC}"
    read -p "Continue with commit? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "${GREEN}✅ Pre-commit checks passed!${NC}"
EOF

# Make pre-commit hook executable
chmod +x .git/hooks/pre-commit
echo "${GREEN}✅ Pre-commit hook installed${NC}"

# Create pre-push hook
echo "${BLUE}Creating pre-push hook...${NC}"
cat > .git/hooks/pre-push << 'EOF'
#!/bin/sh

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "Running pre-push checks..."

# Check total repository size
REPO_SIZE=$(du -sh .git | cut -f1)
echo "Repository size: $REPO_SIZE"

# Check for files that shouldn't be in the repository
UNWANTED_FILES=$(find . -type f \( -name "*.zip" -o -name "*.tar" -o -name "*.tar.gz" -o -name "*.log" -o -name "*.bak" \) -not -path "./.git/*" -not -path "./node_modules/*" 2>/dev/null)

if [ -n "$UNWANTED_FILES" ]; then
    echo "${YELLOW}⚠️  Warning: Found potentially unwanted files:${NC}"
    echo "$UNWANTED_FILES"
    read -p "Continue with push? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "${GREEN}✅ Pre-push checks passed!${NC}"
EOF

# Make pre-push hook executable
chmod +x .git/hooks/pre-push
echo "${GREEN}✅ Pre-push hook installed${NC}"

# Update .gitignore if needed
echo "${BLUE}Checking .gitignore...${NC}"

# Patterns to add to .gitignore
PATTERNS_TO_ADD=(
    "*.zip"
    "*.tar"
    "*.tar.gz"
    "*.tgz"
    "*.rar"
    "*.7z"
    "*.dmg"
    "*.iso"
    "*.jar"
    "*.war"
    "*.exe"
    "*.dll"
    "*.so"
    "*.dylib"
    "*.bin"
    "*.dat"
    "*.bak"
    "*.backup"
    "*.old"
    "*.orig"
)

added_patterns=0
for pattern in "${PATTERNS_TO_ADD[@]}"; do
    if ! grep -q "^${pattern}$" .gitignore 2>/dev/null; then
        echo "$pattern" >> .gitignore
        ((added_patterns++))
    fi
done

if [ $added_patterns -gt 0 ]; then
    echo "${GREEN}✅ Added $added_patterns patterns to .gitignore${NC}"
else
    echo "${GREEN}✅ .gitignore already has all recommended patterns${NC}"
fi

# Summary
echo ""
echo "${GREEN}🎉 Git hooks setup complete!${NC}"
echo ""
echo "The following protections are now active:"
echo "  ${GREEN}✓${NC} Pre-commit: Blocks large files (>5MB)"
echo "  ${GREEN}✓${NC} Pre-commit: Blocks archive files (zip, tar, etc.)"
echo "  ${GREEN}✓${NC} Pre-commit: Warns about sensitive information"
echo "  ${GREEN}✓${NC} Pre-push: Final check for unwanted files"
echo "  ${GREEN}✓${NC} Updated .gitignore with comprehensive patterns"
echo ""
echo "${YELLOW}Note: Hooks are local to your repository and not shared via git.${NC}"
echo "${YELLOW}Team members should run this script after cloning.${NC}"