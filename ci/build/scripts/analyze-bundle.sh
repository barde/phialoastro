#!/bin/bash
# Bundle analysis script
set -euo pipefail

echo "=== Analyzing Bundle Size ==="
echo ""

cd /workspace/phialo-design

# Ensure we have a build
if [ ! -d "dist" ]; then
    echo "→ No dist directory found, building first..."
    /scripts/build.sh
fi

# JavaScript bundle analysis
echo "→ JavaScript bundles:"
find dist -name "*.js" -type f -exec ls -lh {} \; | awk '{print $5 "\t" $9}' | sort -hr

echo ""
echo "→ CSS bundles:"
find dist -name "*.css" -type f -exec ls -lh {} \; | awk '{print $5 "\t" $9}' | sort -hr

# Total size analysis
echo ""
echo "→ Total bundle sizes:"
echo -n "  JavaScript: "
find dist -name "*.js" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{s+=$1} END {printf "%.2f KB\n", s/1024}' || \
find dist -name "*.js" -type f -exec stat -c%s {} \; 2>/dev/null | awk '{s+=$1} END {printf "%.2f KB\n", s/1024}'

echo -n "  CSS: "
find dist -name "*.css" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{s+=$1} END {printf "%.2f KB\n", s/1024}' || \
find dist -name "*.css" -type f -exec stat -c%s {} \; 2>/dev/null | awk '{s+=$1} END {printf "%.2f KB\n", s/1024}'

echo -n "  Images: "
find dist -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" -o -name "*.svg" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{s+=$1} END {printf "%.2f MB\n", s/1024/1024}' || \
find dist -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" -o -name "*.svg" -type f -exec stat -c%s {} \; 2>/dev/null | awk '{s+=$1} END {printf "%.2f MB\n", s/1024/1024}'

echo -n "  Total: "
du -sh dist/ | awk '{print $1}'

# Performance budget check
echo ""
echo "→ Performance budget check:"
JS_SIZE=$(find dist -name "*.js" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{s+=$1} END {print s}' || \
          find dist -name "*.js" -type f -exec stat -c%s {} \; 2>/dev/null | awk '{s+=$1} END {print s}')
CSS_SIZE=$(find dist -name "*.css" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{s+=$1} END {print s}' || \
           find dist -name "*.css" -type f -exec stat -c%s {} \; 2>/dev/null | awk '{s+=$1} END {print s}')

# Check against budgets (in bytes)
MAX_JS=358400    # 350KB
MAX_CSS=51200    # 50KB

if [ "$JS_SIZE" -lt "$MAX_JS" ]; then
    echo "  ✓ JavaScript: $(($JS_SIZE / 1024))KB < 350KB budget"
else
    echo "  ❌ JavaScript: $(($JS_SIZE / 1024))KB > 350KB budget"
fi

if [ "$CSS_SIZE" -lt "$MAX_CSS" ]; then
    echo "  ✓ CSS: $(($CSS_SIZE / 1024))KB < 50KB budget"
else
    echo "  ❌ CSS: $(($CSS_SIZE / 1024))KB > 50KB budget"
fi

# Check for bundle visualizer output
if [ -f "stats.html" ]; then
    echo ""
    echo "→ Bundle visualizer report generated at: stats.html"
    echo "  Copy to dist/_stats.html for web access"
    cp stats.html dist/_stats.html
fi

echo ""
echo "✓ Bundle analysis completed!"