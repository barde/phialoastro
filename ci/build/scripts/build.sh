#!/bin/bash
# Build script for production
set -euo pipefail

echo "=== Building Phialo Design for Production ==="
echo ""

cd /workspace/phialo-design

# Clean previous builds
echo "→ Cleaning previous builds..."
rm -rf dist .astro

# Run type checking
echo "→ Running type checking..."
npm run typecheck

# Build the site
echo "→ Building Astro site..."
npm run build

# Show build stats
echo ""
echo "→ Build complete! Stats:"
du -sh dist/
find dist -type f -name "*.js" -exec du -h {} + | sort -hr | head -10
find dist -type f -name "*.css" -exec du -h {} + | sort -hr | head -5

# Generate bundle analysis if requested
if [ "${ANALYZE_BUNDLE:-false}" = "true" ]; then
    echo ""
    echo "→ Generating bundle analysis..."
    if [ -f stats.html ]; then
        cp stats.html dist/_stats.html
        echo "Bundle analysis available at: /_stats.html"
    fi
fi

echo ""
echo "✓ Build completed successfully!"