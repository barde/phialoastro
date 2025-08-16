#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import crypto from 'crypto';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '../public/images/portfolio');
const CACHE_FILE = path.join(__dirname, '../.image-cache.json');
const SIZES = [320, 400, 640, 800, 1024, 1200, 1600, 2000];

// Get number of CPU cores for parallel processing
const MAX_WORKERS = Math.max(1, os.cpus().length - 1);

// Calculate file hash for change detection
async function getFileHash(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Load cache of processed images
async function loadCache() {
  try {
    const cacheData = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(cacheData);
  } catch {
    return {};
  }
}

// Save cache of processed images
async function saveCache(cache) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Check if all output files exist for a given image
async function outputFilesExist(baseName) {
  const checks = [];
  
  for (const width of SIZES) {
    const webpPath = path.join(IMAGES_DIR, `${baseName}-${width}w.webp`);
    checks.push(fs.access(webpPath).then(() => true).catch(() => false));
    
    if (width >= 800) {
      const avifPath = path.join(IMAGES_DIR, `${baseName}-${width}w.avif`);
      checks.push(fs.access(avifPath).then(() => true).catch(() => false));
    }
  }
  
  const results = await Promise.all(checks);
  return results.every(exists => exists);
}

// Process a single image (can be run in worker thread)
async function processImage(inputPath, baseName, skipExisting = true) {
  const results = [];
  
  for (const width of SIZES) {
    // Generate WebP
    const webpPath = path.join(IMAGES_DIR, `${baseName}-${width}w.webp`);
    
    if (skipExisting) {
      try {
        await fs.access(webpPath);
        // File exists, skip
      } catch {
        // File doesn't exist, generate it
        await sharp(inputPath)
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality: width <= 640 ? 75 : 85 })
          .toFile(webpPath);
        results.push(`WebP ${width}w`);
      }
    } else {
      await sharp(inputPath)
        .resize(width, null, { withoutEnlargement: true })
        .webp({ quality: width <= 640 ? 75 : 85 })
        .toFile(webpPath);
      results.push(`WebP ${width}w`);
    }
    
    // Generate AVIF for larger sizes
    if (width >= 800) {
      const avifPath = path.join(IMAGES_DIR, `${baseName}-${width}w.avif`);
      
      if (skipExisting) {
        try {
          await fs.access(avifPath);
          // File exists, skip
        } catch {
          // File doesn't exist, generate it
          await sharp(inputPath)
            .resize(width, null, { withoutEnlargement: true })
            .avif({ quality: 80 })
            .toFile(avifPath);
          results.push(`AVIF ${width}w`);
        }
      } else {
        await sharp(inputPath)
          .resize(width, null, { withoutEnlargement: true })
          .avif({ quality: 80 })
          .toFile(avifPath);
        results.push(`AVIF ${width}w`);
      }
    }
  }
  
  return results;
}

// Process images in parallel using worker threads
async function processImagesInParallel(imagesToProcess) {
  const chunks = [];
  const chunkSize = Math.ceil(imagesToProcess.length / MAX_WORKERS);
  
  // Split images into chunks for parallel processing
  for (let i = 0; i < imagesToProcess.length; i += chunkSize) {
    chunks.push(imagesToProcess.slice(i, i + chunkSize));
  }
  
  const promises = chunks.map(async (chunk) => {
    for (const { file, inputPath, baseName, forceRegenerate } of chunk) {
      try {
        const generated = await processImage(inputPath, baseName, !forceRegenerate);
        if (generated.length > 0) {
          console.info(`✓ Generated ${generated.length} files for ${file}`);
        } else {
          console.info(`✓ Skipped ${file} - all formats already exist`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to process ${file}: ${error.message}`);
      }
    }
  });
  
  await Promise.all(promises);
}

async function generateModernFormats() {
  const startTime = Date.now();
  
  try {
    const files = await fs.readdir(IMAGES_DIR);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png)$/i.test(file) && !file.includes('-w.')
    );

    console.info(`Found ${imageFiles.length} images to check`);
    console.info(`Using ${MAX_WORKERS} parallel workers`);
    
    // Load cache to track changes
    const cache = await loadCache();
    const imagesToProcess = [];
    let skippedCount = 0;
    let changedCount = 0;
    
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
      
      // Option 3: Check if image has changed
      const currentHash = await getFileHash(inputPath);
      const cachedHash = cache[file]?.hash;
      const hasChanged = currentHash !== cachedHash;
      
      // Option 1: Check if all output files exist
      const allFilesExist = await outputFilesExist(baseName);
      
      if (!hasChanged && allFilesExist) {
        skippedCount++;
        continue; // Skip this image completely
      }
      
      if (hasChanged) {
        changedCount++;
        console.info(`🔄 ${file} has changed - will regenerate`);
      } else if (!allFilesExist) {
        console.info(`🆕 ${file} missing some output files - will generate`);
      }
      
      imagesToProcess.push({
        file,
        inputPath,
        baseName,
        hash: currentHash,
        forceRegenerate: hasChanged
      });
    }
    
    console.info(`📊 Status: ${skippedCount} unchanged, ${changedCount} changed, ${imagesToProcess.length} to process`);
    
    if (imagesToProcess.length === 0) {
      console.info('✅ All images are up to date!');
      return;
    }
    
    // Option 2: Process images in parallel
    console.info(`Processing ${imagesToProcess.length} images in parallel...`);
    await processImagesInParallel(imagesToProcess);
    
    // Update cache with processed images
    for (const { file, hash } of imagesToProcess) {
      cache[file] = { 
        hash, 
        processedAt: new Date().toISOString() 
      };
    }
    await saveCache(cache);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.info(`✅ Image processing complete in ${duration}s!`);
    
  } catch (error) {
    console.error('Error generating modern formats:', error);
    // Don't fail the build if image processing fails
    console.warn('⚠️ Continuing build without image optimization');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.info('\n⚠️ Image generation interrupted');
  process.exit(0);
});

generateModernFormats();