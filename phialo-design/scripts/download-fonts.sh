#!/bin/bash

# Create fonts directory
mkdir -p public/fonts

# Download Inter fonts
echo "Downloading Inter fonts..."
# Inter Regular 400
curl -L "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nNjkx0YuA.woff2" -o public/fonts/inter-400-latin.woff2
# Inter Medium 500
curl -L "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTcHuS_nOjkx0YuA.woff2" -o public/fonts/inter-500-latin.woff2
# Inter SemiBold 600
curl -L "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTe3uS_nOjkx0YuA.woff2" -o public/fonts/inter-600-latin.woff2

# Download Playfair Display fonts
echo "Downloading Playfair Display fonts..."
# Playfair Display Regular 400
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v38/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.woff2" -o public/fonts/playfair-400-latin.woff2
# Playfair Display Medium 500
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v38/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vUDQ.woff2" -o public/fonts/playfair-500-latin.woff2
# Playfair Display SemiBold 600
curl -L "https://fonts.gstatic.com/s/playfairdisplay/v38/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKebukDQ.woff2" -o public/fonts/playfair-600-latin.woff2

echo "Fonts downloaded successfully!"