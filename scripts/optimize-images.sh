#!/bin/bash

# Image optimization script for Phialo Design
# Converts large images to WebP format for reduced file size

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SOURCE_DIR="phialo-design/public/images"
QUALITY=85
MIN_SIZE=500 # Minimum size in KB to consider for optimization

echo -e "${GREEN}Phialo Design Image Optimization Script${NC}"
echo "========================================"
echo ""

# Check if sharp-cli is installed
if ! command -v sharp &> /dev/null; then
    echo -e "${RED}Error: sharp-cli is not installed${NC}"
    echo ""
    echo "Please install sharp-cli globally:"
    echo "  pnpm add -g sharp-cli"
    echo ""
    exit 1
fi

# Find all large images
echo -e "${YELLOW}Analyzing images larger than ${MIN_SIZE}KB...${NC}"
echo ""

total_original_size=0
total_new_size=0
count=0

# Create a temporary file to store image paths
temp_file=$(mktemp)

# Find all images larger than MIN_SIZE KB
find "$SOURCE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -size +${MIN_SIZE}k > "$temp_file"

# Process each image
while IFS= read -r image_path; do
    if [ -f "$image_path" ]; then
        # Get original size
        original_size=$(stat -f%z "$image_path" 2>/dev/null || stat -c%s "$image_path" 2>/dev/null)
        original_size_mb=$(echo "scale=2; $original_size / 1048576" | bc)
        
        # Generate WebP filename
        webp_path="${image_path%.*}.webp"
        filename=$(basename "$image_path")
        
        echo -e "Processing: ${filename}"
        echo -e "  Original size: ${original_size_mb} MB"
        
        # Estimate new size (60-80% reduction, we'll use 70% for estimation)
        estimated_new_size=$(echo "scale=0; $original_size * 0.3" | bc)
        estimated_new_size_mb=$(echo "scale=2; $estimated_new_size / 1048576" | bc)
        echo -e "  Estimated WebP size: ${estimated_new_size_mb} MB"
        echo -e "  Estimated savings: ${GREEN}$(echo "scale=0; 70" | bc)%${NC}"
        
        # Add to totals
        total_original_size=$((total_original_size + original_size))
        total_new_size=$((total_new_size + estimated_new_size))
        count=$((count + 1))
        
        # Show the command that would be run (commented out for safety)
        echo -e "  Command: sharp -i \"$image_path\" -o \"$webp_path\" -f webp -q $QUALITY"
        echo ""
    fi
done < "$temp_file"

# Clean up
rm "$temp_file"

# Summary
echo "========================================"
echo -e "${GREEN}Summary:${NC}"
echo -e "Images to optimize: ${count}"
echo -e "Total original size: $(echo "scale=2; $total_original_size / 1048576" | bc) MB"
echo -e "Estimated new size: $(echo "scale=2; $total_new_size / 1048576" | bc) MB"
echo -e "Estimated total savings: ${GREEN}$(echo "scale=2; ($total_original_size - $total_new_size) / 1048576" | bc) MB${NC}"
echo -e "Estimated reduction: ${GREEN}$(echo "scale=0; (($total_original_size - $total_new_size) * 100) / $total_original_size" | bc)%${NC}"
echo ""
echo -e "${YELLOW}Note: This is a dry run. To actually convert images:${NC}"
echo "1. Install sharp-cli: pnpm add -g sharp-cli"
echo "2. Run this script with the --convert flag (not implemented yet)"
echo "3. Update your HTML/Astro files to use .webp extensions"
echo "4. Consider keeping original images as fallbacks"