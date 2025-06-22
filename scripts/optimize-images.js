#!/usr/bin/env node

/**
 * Image optimization script for Phialo Design
 * Converts large images to WebP format using the sharp library
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SOURCE_DIR = path.join(__dirname, '..', 'phialo-design', 'public', 'images');
const QUALITY = 85;
const MIN_SIZE_KB = 500;
const MIN_SIZE_BYTES = MIN_SIZE_KB * 1024;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

console.log(`${colors.green}Phialo Design Image Optimization Script${colors.reset}`);
console.log('========================================\n');

// Check if sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.error(`${colors.red}Error: sharp is not installed${colors.reset}\n`);
  console.log('Please install sharp:');
  console.log('  npm install sharp\n');
  console.log('Or install it globally for the CLI:');
  console.log('  npm install -g sharp-cli\n');
  process.exit(1);
}

const sharp = require('sharp');

// Function to get all image files recursively
function getImageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getImageFiles(filePath, fileList);
    } else if (stat.size > MIN_SIZE_BYTES && /\.(jpg|jpeg|png)$/i.test(file)) {
      fileList.push({
        path: filePath,
        size: stat.size,
        relativePath: path.relative(SOURCE_DIR, filePath)
      });
    }
  });
  
  return fileList;
}

// Function to convert image to WebP
async function convertToWebP(imagePath, outputPath) {
  try {
    const info = await sharp(imagePath).metadata();
    await sharp(imagePath)
      .webp({ quality: QUALITY })
      .toFile(outputPath);
    
    const outputStats = fs.statSync(outputPath);
    return {
      success: true,
      originalSize: fs.statSync(imagePath).size,
      newSize: outputStats.size,
      info
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Main function
async function main() {
  console.log(`${colors.yellow}Analyzing images larger than ${MIN_SIZE_KB}KB...${colors.reset}\n`);
  
  const images = getImageFiles(SOURCE_DIR);
  images.sort((a, b) => b.size - a.size);
  
  let totalOriginalSize = 0;
  let totalEstimatedNewSize = 0;
  
  console.log('Found the following large images:\n');
  
  for (const image of images) {
    const sizeMB = (image.size / (1024 * 1024)).toFixed(2);
    const estimatedNewSize = image.size * 0.3; // Estimate 70% reduction
    const estimatedSizeMB = (estimatedNewSize / (1024 * 1024)).toFixed(2);
    
    console.log(`📷 ${image.relativePath}`);
    console.log(`   Original: ${sizeMB} MB`);
    console.log(`   Estimated WebP: ${estimatedSizeMB} MB`);
    console.log(`   Estimated savings: ${colors.green}~70%${colors.reset}\n`);
    
    totalOriginalSize += image.size;
    totalEstimatedNewSize += estimatedNewSize;
  }
  
  console.log('========================================');
  console.log(`${colors.green}Summary:${colors.reset}`);
  console.log(`Images to optimize: ${images.length}`);
  console.log(`Total original size: ${(totalOriginalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Estimated new size: ${(totalEstimatedNewSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Estimated total savings: ${colors.green}${((totalOriginalSize - totalEstimatedNewSize) / (1024 * 1024)).toFixed(2)} MB${colors.reset}`);
  console.log(`Estimated reduction: ${colors.green}${Math.round(((totalOriginalSize - totalEstimatedNewSize) / totalOriginalSize) * 100)}%${colors.reset}\n`);
  
  console.log(`${colors.yellow}To convert images to WebP:${colors.reset}`);
  console.log('1. Run: node scripts/optimize-images.js --convert');
  console.log('2. Update your HTML/Astro files to use .webp extensions');
  console.log('3. Consider implementing <picture> elements for fallbacks\n');
  
  // If --convert flag is passed, offer to convert
  if (process.argv.includes('--convert')) {
    console.log(`\n${colors.yellow}Ready to convert images. This will create .webp versions alongside originals.${colors.reset}`);
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    // Wait 5 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('Converting images...\n');
    
    for (const image of images) {
      const webpPath = image.path.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      console.log(`Converting: ${image.relativePath}`);
      
      const result = await convertToWebP(image.path, webpPath);
      
      if (result.success) {
        const reduction = ((1 - result.newSize / result.originalSize) * 100).toFixed(1);
        console.log(`  ✅ Saved ${reduction}% (${(result.newSize / 1024 / 1024).toFixed(2)} MB)\n`);
      } else {
        console.log(`  ❌ Error: ${result.error}\n`);
      }
    }
  }
}

// Run the script
main().catch(console.error);