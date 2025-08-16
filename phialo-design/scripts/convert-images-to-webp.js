#!/usr/bin/env node

/**
 * Script to convert portfolio images to WebP format
 * Requires: sharp package
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORTFOLIO_DIR = path.join(__dirname, '../public/images/portfolio');
const WEBP_DIR = path.join(__dirname, '../public/images/portfolio-webp');

// Image quality settings
const WEBP_QUALITY = 85;
const AVIF_QUALITY = 80;

// Responsive sizes for srcset
const RESPONSIVE_SIZES = [
  { width: 400, suffix: 'sm' },
  { width: 800, suffix: 'md' },
  { width: 1200, suffix: 'lg' },
  { width: 1600, suffix: 'xl' }
];

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function convertImage(inputPath, filename) {
  const nameWithoutExt = path.parse(filename).name;
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  console.info(`Converting ${filename}...`);
  
  const conversions = [];
  
  // Generate responsive WebP versions
  for (const size of RESPONSIVE_SIZES) {
    // Only create smaller versions if the original is larger
    if (metadata.width >= size.width) {
      const webpPath = path.join(WEBP_DIR, `${nameWithoutExt}-${size.suffix}.webp`);
      
      conversions.push(
        image
          .clone()
          .resize(size.width, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ quality: WEBP_QUALITY })
          .toFile(webpPath)
          .then(() => {
            console.info(`  ✓ Created ${nameWithoutExt}-${size.suffix}.webp`);
          })
      );
    }
  }
  
  // Also create a full-size WebP version
  const fullWebpPath = path.join(WEBP_DIR, `${nameWithoutExt}.webp`);
  conversions.push(
    image
      .clone()
      .webp({ quality: WEBP_QUALITY })
      .toFile(fullWebpPath)
      .then(() => {
        console.info(`  ✓ Created ${nameWithoutExt}.webp (full size)`);
      })
  );
  
  // Create AVIF version for supported browsers (smaller file size)
  const avifPath = path.join(WEBP_DIR, `${nameWithoutExt}.avif`);
  conversions.push(
    image
      .clone()
      .resize(1200, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .avif({ quality: AVIF_QUALITY })
      .toFile(avifPath)
      .then(() => {
        console.info(`  ✓ Created ${nameWithoutExt}.avif`);
      })
      .catch(err => {
        console.warn(`  ⚠ AVIF conversion failed for ${filename}:`, err.message);
      })
  );
  
  return Promise.all(conversions);
}

async function main() {
  try {
    // Ensure output directory exists
    await ensureDirectoryExists(WEBP_DIR);
    
    // Read all files from portfolio directory
    const files = await fs.readdir(PORTFOLIO_DIR);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png)$/i.test(file)
    );
    
    console.info(`Found ${imageFiles.length} images to convert\n`);
    
    // Convert each image
    for (const file of imageFiles) {
      const inputPath = path.join(PORTFOLIO_DIR, file);
      try {
        await convertImage(inputPath, file);
      } catch (error) {
        console.error(`Failed to convert ${file}:`, error.message);
      }
    }
    
    console.info('\n✅ Image conversion complete!');
    
    // Generate a mapping file for easy reference
    const mapping = {};
    for (const file of imageFiles) {
      const nameWithoutExt = path.parse(file).name;
      mapping[file] = {
        webp: `${nameWithoutExt}.webp`,
        avif: `${nameWithoutExt}.avif`,
        responsive: RESPONSIVE_SIZES.map(size => ({
          width: size.width,
          webp: `${nameWithoutExt}-${size.suffix}.webp`
        }))
      };
    }
    
    const mappingPath = path.join(WEBP_DIR, 'image-mapping.json');
    await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));
    console.info(`\n📝 Image mapping saved to ${mappingPath}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();