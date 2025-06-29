#!/bin/bash
# Build script for preview/development
set -euo pipefail

echo "=== Building Phialo Design for Preview ==="
echo ""

cd /workspace/phialo-design

# Clean previous builds
echo "→ Cleaning previous builds..."
rm -rf dist .astro

# Set preview environment
export NODE_ENV=development
export ASTRO_MODE=preview

# Build with source maps for easier debugging
echo "→ Building Astro site with source maps..."
npm run build

# Add robots.txt to prevent indexing
echo "→ Adding robots.txt for preview..."
cat > dist/robots.txt << EOF
User-agent: *
Disallow: /
EOF

# Show build stats
echo ""
echo "→ Preview build complete! Stats:"
du -sh dist/
find dist -type f -name "*.js" -exec du -h {} + | sort -hr | head -10

echo ""
echo "✓ Preview build completed successfully!"