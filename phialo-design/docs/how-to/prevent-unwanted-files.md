# Preventing Unwanted Files in Git Repositories

This guide provides a comprehensive strategy to prevent accidentally committing unwanted files (like zip archives, logs, and temporary files) to your Git repository.

## Quick Start Checklist

- [ ] Update `.gitignore` with comprehensive patterns
- [ ] Install and configure pre-commit hooks
- [ ] Set up GitHub Actions for CI checks
- [ ] Configure git globally to exclude common files
- [ ] Establish team code review practices

## 1. Enhanced .gitignore Configuration

Add these patterns to your `.gitignore` file to prevent common unwanted files:

```gitignore
# Archives and compressed files
*.zip
*.tar
*.tar.gz
*.tgz
*.rar
*.7z
*.dmg
*.iso
*.jar
*.war

# Large binary files
*.exe
*.dll
*.so
*.dylib
*.bin
*.dat

# Database files
*.sql
*.sqlite
*.db

# Backup files
*.bak
*.backup
*.old
*.orig
*~

# Log files (comprehensive)
*.log
logs/
*.log.*
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.npm

# Build artifacts
dist/
build/
out/
.next/
.nuxt/
.vuepress/dist
.docusaurus
.cache/
.parcel-cache/
.turbo/

# Package manager files
package-lock.json.bak
yarn.lock.bak
pnpm-lock.yaml.bak

# Temporary files
tmp/
temp/
*.tmp
*.temp
.tmp/
.temp/

# macOS specific
.DS_Store
.AppleDouble
.LSOverride
Icon
._*
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk

# Windows specific
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db
*.stackdump
[Dd]esktop.ini
$RECYCLE.BIN/
*.cab
*.msi
*.msix
*.msm
*.msp
*.lnk

# Editor directories and files
.idea/
.vscode/
*.swp
*.swo
*~
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace
*.sublime-project

# Coverage and test artifacts
coverage/
*.lcov
.nyc_output
test-results/
junit.xml
*.coverage
*.coveragexml
.pytest_cache/
nosetests.xml
coverage.xml
*.cover
.hypothesis/
```

## 2. Git Hooks Setup

### Pre-commit Hook

Create `.git/hooks/pre-commit` (make it executable with `chmod +x`):

```bash
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
```

### Pre-push Hook

Create `.git/hooks/pre-push` (make it executable with `chmod +x`):

```bash
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
```

## 3. Using Pre-commit Framework

For a more robust solution, use the pre-commit framework:

### Installation

```bash
# Install pre-commit
npm install --save-dev pre-commit

# Or globally
npm install -g pre-commit
```

### Configuration

Create `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-added-large-files
        args: ['--maxkb=5000']
      - id: check-case-conflict
      - id: check-merge-conflict
      - id: detect-private-key
      - id: end-of-file-fixer
      - id: trailing-whitespace
      - id: mixed-line-ending

  - repo: local
    hooks:
      - id: check-unwanted-files
        name: Check for unwanted files
        entry: bash -c 'git ls-files | grep -E "\.(zip|tar|tar\.gz|tgz|rar|7z|exe|dll|so|dylib)$" && exit 1 || exit 0'
        language: system
        pass_filenames: false

      - id: check-logs
        name: Check for log files
        entry: bash -c 'git ls-files | grep -E "\.log$|\.log\.[0-9]+$" && exit 1 || exit 0'
        language: system
        pass_filenames: false
```

Add to `package.json`:

```json
{
  "scripts": {
    "prepare": "pre-commit install"
  }
}
```

## 4. GitHub Actions CI Checks

Create `.github/workflows/file-checks.yml`:

```yaml
name: File Validation

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main, master, develop]

jobs:
  check-files:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check for prohibited files
        run: |
          echo "Checking for prohibited file types..."
          
          PROHIBITED_PATTERNS="\.zip$|\.tar$|\.tar\.gz$|\.tgz$|\.rar$|\.7z$|\.exe$|\.dll$|\.so$|\.dylib$|\.dmg$|\.iso$"
          
          prohibited_files=$(git ls-files | grep -E "$PROHIBITED_PATTERNS" || true)
          
          if [ -n "$prohibited_files" ]; then
            echo "❌ Found prohibited file types:"
            echo "$prohibited_files"
            echo ""
            echo "Please remove these files from the repository."
            exit 1
          fi
          
          echo "✅ No prohibited files found"

      - name: Check for large files
        run: |
          echo "Checking for large files..."
          
          MAX_SIZE=5242880  # 5MB in bytes
          large_files=""
          
          while IFS= read -r file; do
            if [ -f "$file" ]; then
              size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)
              if [ "$size" -gt "$MAX_SIZE" ]; then
                size_mb=$((size / 1048576))
                large_files="${large_files}${file} (${size_mb}MB)\n"
              fi
            fi
          done < <(git ls-files)
          
          if [ -n "$large_files" ]; then
            echo "❌ Found files larger than 5MB:"
            echo -e "$large_files"
            echo ""
            echo "Consider using Git LFS or excluding these files."
            exit 1
          fi
          
          echo "✅ No large files found"

      - name: Check for sensitive information
        run: |
          echo "Checking for potential sensitive information..."
          
          SENSITIVE_PATTERNS="password=|api_key=|secret=|private_key|BEGIN RSA|BEGIN DSA|BEGIN EC|BEGIN OPENSSH|BEGIN PGP"
          
          sensitive_files=$(git grep -l -E -i "$SENSITIVE_PATTERNS" || true)
          
          if [ -n "$sensitive_files" ]; then
            echo "⚠️  Warning: Potential sensitive information detected in:"
            echo "$sensitive_files"
            echo ""
            echo "Please review these files for sensitive data."
            # This is a warning, not a failure
          fi

      - name: Repository size check
        run: |
          echo "Checking repository size..."
          
          # Get size in KB
          repo_size=$(du -sk . | cut -f1)
          repo_size_mb=$((repo_size / 1024))
          
          echo "Repository size: ${repo_size_mb}MB"
          
          # Warn if over 100MB
          if [ "$repo_size_mb" -gt 100 ]; then
            echo "⚠️  Warning: Repository is larger than 100MB"
            echo "Consider cleaning up unnecessary files"
          fi
```

## 5. Team Processes and Code Review

### Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Checklist
- [ ] No temporary or build files included
- [ ] No archive files (zip, tar, etc.)
- [ ] No log files
- [ ] No files larger than 5MB
- [ ] Sensitive information removed
- [ ] .gitignore updated if needed

## Files Changed
- List key files modified

## Testing
- How has this been tested?
```

### Code Review Guidelines

Add to your team documentation:

1. **Always check the Files Changed tab** for:
   - Unexpected binary files
   - Large files
   - Temporary or generated files
   - Log files

2. **Use GitHub's file size warnings**:
   - Files over 50MB will be blocked
   - Files over 10MB will show warnings

3. **Regular repository maintenance**:
   - Quarterly review of repository size
   - Clean up old branches
   - Use `git gc` periodically

## 6. Global Git Configuration

Configure git globally to exclude common files:

```bash
# Create global gitignore
touch ~/.gitignore_global

# Add common patterns
echo "*.log" >> ~/.gitignore_global
echo "*.zip" >> ~/.gitignore_global
echo "*.tar" >> ~/.gitignore_global
echo "*.tar.gz" >> ~/.gitignore_global
echo ".DS_Store" >> ~/.gitignore_global
echo "Thumbs.db" >> ~/.gitignore_global

# Configure git to use it
git config --global core.excludesfile ~/.gitignore_global
```

## 7. Automated Cleanup Scripts

Create `scripts/clean-repo.sh`:

```bash
#!/bin/bash

echo "🧹 Cleaning repository..."

# Remove common unwanted files
find . -name "*.log" -not -path "./.git/*" -not -path "./node_modules/*" -delete
find . -name "*.zip" -not -path "./.git/*" -not -path "./node_modules/*" -delete
find . -name "*.bak" -not -path "./.git/*" -not -path "./node_modules/*" -delete
find . -name ".DS_Store" -not -path "./.git/*" -delete

# Clean git cache
git gc --prune=now

echo "✅ Repository cleaned!"
```

## 8. Using Git LFS for Large Files

If you need to store large files:

```bash
# Install Git LFS
git lfs install

# Track large file types
git lfs track "*.psd"
git lfs track "*.ai"
git lfs track "*.sketch"

# Add .gitattributes
git add .gitattributes
git commit -m "Configure Git LFS"
```

## Implementation Priority

1. **Immediate** (Do today):
   - Update `.gitignore` with comprehensive patterns
   - Install pre-commit hooks
   - Add GitHub Actions workflow

2. **Short-term** (This week):
   - Configure global gitignore
   - Create PR template
   - Document team processes

3. **Long-term** (This month):
   - Set up Git LFS if needed
   - Establish regular maintenance schedule
   - Train team on best practices

## Troubleshooting

### If unwanted files are already committed:

```bash
# Remove file from repository but keep locally
git rm --cached filename.zip

# Remove all files matching pattern
git rm --cached *.log

# Commit the removal
git commit -m "Remove unwanted files"
```

### To clean repository history (use with caution):

```bash
# Use BFG Repo-Cleaner for large-scale cleanup
java -jar bfg.jar --delete-files "*.{zip,log}" repo.git
```

## Additional Resources

- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [Pre-commit Framework](https://pre-commit.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Git LFS](https://git-lfs.github.com/)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)