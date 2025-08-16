#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '../public/images/portfolio');
const SIZES = [320, 400, 640, 800, 1024, 1200, 1600, 2000];

async function generateModernFormats() {
  try {
    const files = await fs.readdir(IMAGES_DIR);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png)$/i.test(file) && !file.includes('-w.')
    );

    console.info(`Found ${imageFiles.length} images to process`);

    for (const file of imageFiles) {
      const inputPath = path.join(IMAGES_DIR, file);
      const baseName = path.basename(file, path.extname(file));
      
      // Check if file exists and has content (not LFS pointer)
      try {
        const stats = await fs.stat(inputPath);
        if (stats.size < 200) {
          console.warn(`⚠️ Skipping ${file} - appears to be LFS pointer`);
          continue;
        }
      } catch (error) {
        console.warn(`⚠️ Skipping ${file} - file not accessible`);
        continue;
      }
      
      console.info(`Processing: ${file}`);
      
      try {
        for (const width of SIZES) {
          // Generate WebP
          const webpPath = path.join(IMAGES_DIR, `${baseName}-${width}w.webp`);
          await sharp(inputPath)
            .resize(width, null, { withoutEnlargement: true })
            .webp({ quality: width <= 640 ? 75 : 85 })
            .toFile(webpPath);
          
          // Generate AVIF for larger sizes
          if (width >= 800) {
            const avifPath = path.join(IMAGES_DIR, `${baseName}-${width}w.avif`);
            await sharp(inputPath)
              .resize(width, null, { withoutEnlargement: true })
              .avif({ quality: 80 })
              .toFile(avifPath);
          }
        }
        
        console.info(`✓ Generated modern formats for ${file}`);
      } catch (error) {
        console.warn(`⚠️ Failed to process ${file}: ${error.message}`);
      }
    }
    
    console.info('✅ Image processing complete!');
  } catch (error) {
    console.error('Error generating modern formats:', error);
    // Don't fail the build if LFS files are missing
    console.warn('⚠️ Continuing build without image optimization');
  }
}

generateModernFormats();