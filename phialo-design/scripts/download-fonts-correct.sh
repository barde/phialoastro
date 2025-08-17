#!/bin/bash

# Create fonts directory
mkdir -p public/fonts

# Function to download Google Font
download_google_font() {
  local font_family="$1"
  local weights="$2"
  local output_prefix="$3"
  
  # Get the CSS from Google Fonts
  local css_url="https://fonts.googleapis.com/css2?family=${font_family}:wght@${weights}&display=swap"
  local css_content=$(curl -s -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "$css_url")
  
  # Extract and download each woff2 file
  echo "$css_content" | grep -o "url([^)]*)" | sed 's/url(//;s/)//' | while read -r font_url; do
    # Extract weight from the CSS
    local weight=$(echo "$css_content" | grep -B5 "$font_url" | grep "font-weight:" | head -1 | sed 's/.*font-weight: //;s/;.*//')
    
    if [ ! -z "$weight" ]; then
      echo "Downloading ${font_family} weight ${weight}..."
      curl -s -L "$font_url" -o "public/fonts/${output_prefix}-${weight}-latin.woff2"
    fi
  done
}

# Download Inter fonts
download_google_font "Inter" "400,500,600" "inter"

# Download Playfair Display fonts
download_google_font "Playfair+Display" "400,500,600" "playfair"

echo "Fonts downloaded successfully!"
ls -lh public/fonts/