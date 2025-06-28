#!/bin/bash
# Image optimization script
set -euo pipefail

echo "=== Optimizing Images ==="
echo ""

cd /workspace/phialo-design

# Function to optimize images in a directory
optimize_dir() {
    local dir=$1
    echo "→ Optimizing images in $dir..."
    
    # Count images before optimization
    local count=$(find "$dir" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" \) | wc -l)
    echo "  Found $count images"
    
    if [ $count -eq 0 ]; then
        return
    fi
    
    # Optimize JPEGs
    find "$dir" -type f \( -name "*.jpg" -o -name "*.jpeg" \) -exec \
        npx sharp-cli {} -o {} --quality 85 --mozjpeg \;
    
    # Optimize PNGs
    find "$dir" -type f -name "*.png" -exec \
        npx sharp-cli {} -o {} --quality 90 \;
    
    # Convert large images to WebP if beneficial
    find "$dir" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -size +100k -exec bash -c '
        file="$1"
        webp_file="${file%.*}.webp"
        if [ ! -f "$webp_file" ]; then
            npx sharp-cli "$file" -o "$webp_file" --quality 85
            original_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
            webp_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file")
            if [ $webp_size -lt $original_size ]; then
                echo "  Created WebP: $webp_file (saved $(( ($original_size - $webp_size) / 1024 ))KB)"
            else
                rm "$webp_file"
            fi
        fi
    ' _ {} \;
    
    # Optimize SVGs
    find "$dir" -type f -name "*.svg" -exec \
        npx svgo {} -o {} \;
}

# Show initial size
echo "→ Initial image sizes:"
du -sh public/images/ 2>/dev/null || echo "No public/images directory"
du -sh src/assets/ 2>/dev/null || echo "No src/assets directory"

# Optimize images in public directory
if [ -d "public/images" ]; then
    optimize_dir "public/images"
fi

# Optimize images in src/assets
if [ -d "src/assets" ]; then
    optimize_dir "src/assets"
fi

# Show final size
echo ""
echo "→ Final image sizes:"
du -sh public/images/ 2>/dev/null || echo "No public/images directory"
du -sh src/assets/ 2>/dev/null || echo "No src/assets directory"

echo ""
echo "✓ Image optimization completed!"