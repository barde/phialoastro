#!/bin/bash

# Test script to verify caching effectiveness
# Usage: ./scripts/test-cache.sh

set -e

echo "🧪 Testing Build Cache Performance"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Clean up any existing cache
echo "🧹 Cleaning existing cache..."
rm -f .image-cache.json
rm -f public/images/portfolio/*-*w.webp
rm -f public/images/portfolio/*-*w.avif
echo ""

# Test 1: First build (no cache)
echo -e "${YELLOW}Test 1: First Build (No Cache)${NC}"
echo "------------------------------"
START_TIME=$(date +%s)
node scripts/generate-modern-images.js
END_TIME=$(date +%s)
FIRST_BUILD_TIME=$((END_TIME - START_TIME))
echo -e "${GREEN}✓ First build completed in ${FIRST_BUILD_TIME}s${NC}"
echo ""

# Count generated files
WEBP_COUNT=$(find public/images/portfolio -name "*-*w.webp" | wc -l)
AVIF_COUNT=$(find public/images/portfolio -name "*-*w.avif" | wc -l)
echo "📊 Generated: ${WEBP_COUNT} WebP files, ${AVIF_COUNT} AVIF files"
echo ""

# Test 2: Cached build (no changes)
echo -e "${YELLOW}Test 2: Cached Build (No Changes)${NC}"
echo "---------------------------------"
START_TIME=$(date +%s)
node scripts/generate-modern-images.js
END_TIME=$(date +%s)
CACHED_BUILD_TIME=$((END_TIME - START_TIME))
echo -e "${GREEN}✓ Cached build completed in ${CACHED_BUILD_TIME}s${NC}"
echo ""

# Test 3: Single file change
echo -e "${YELLOW}Test 3: Single File Change${NC}"
echo "--------------------------"
# Touch a single image to simulate change
FIRST_IMAGE=$(find public/images/portfolio -name "*.jpg" -o -name "*.png" | head -1)
if [ ! -z "$FIRST_IMAGE" ]; then
    echo "📝 Modifying: $(basename $FIRST_IMAGE)"
    touch "$FIRST_IMAGE"
    START_TIME=$(date +%s)
    node scripts/generate-modern-images.js
    END_TIME=$(date +%s)
    SINGLE_CHANGE_TIME=$((END_TIME - START_TIME))
    echo -e "${GREEN}✓ Single file regeneration completed in ${SINGLE_CHANGE_TIME}s${NC}"
else
    echo "⚠️ No images found to test single file change"
fi
echo ""

# Test 4: Partial cache (delete some generated files)
echo -e "${YELLOW}Test 4: Partial Cache (Missing Files)${NC}"
echo "-------------------------------------"
# Delete a few generated files
find public/images/portfolio -name "*-320w.webp" | head -3 | xargs rm -f
echo "📝 Deleted 3 generated files"
START_TIME=$(date +%s)
node scripts/generate-modern-images.js
END_TIME=$(date +%s)
PARTIAL_CACHE_TIME=$((END_TIME - START_TIME))
echo -e "${GREEN}✓ Partial regeneration completed in ${PARTIAL_CACHE_TIME}s${NC}"
echo ""

# Summary
echo "📈 Performance Summary"
echo "====================="
echo "First build (no cache):     ${FIRST_BUILD_TIME}s"
echo "Cached build (no changes):  ${CACHED_BUILD_TIME}s"
if [ ! -z "$SINGLE_CHANGE_TIME" ]; then
    echo "Single file change:         ${SINGLE_CHANGE_TIME}s"
fi
echo "Partial cache rebuild:      ${PARTIAL_CACHE_TIME}s"
echo ""

# Calculate improvements
if [ $CACHED_BUILD_TIME -gt 0 ]; then
    IMPROVEMENT=$(( (FIRST_BUILD_TIME - CACHED_BUILD_TIME) * 100 / FIRST_BUILD_TIME ))
    echo -e "${GREEN}🚀 Cache Performance: ${IMPROVEMENT}% faster for cached builds${NC}"
fi

# Check cache file
if [ -f .image-cache.json ]; then
    CACHE_ENTRIES=$(grep -c '"hash"' .image-cache.json)
    echo "📦 Cache contains metadata for ${CACHE_ENTRIES} images"
fi

echo ""
echo "✅ Cache testing complete!"