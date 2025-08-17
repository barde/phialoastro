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

// Configuration for different image directories
const IMAGE_CONFIGS = [
  {
    name: 'portfolio',
    dir: path.join(__dirname, '../public/images/portfolio'),
    sizes: [320, 400, 640, 800, 1024, 1200, 1600, 2000],
    generateAvif: true
  },
  {
    name: 'homepage',
    dir: path.join(__dirname, '../public/images/homepage'),
    sizes: [576, 800, 1200],
    generateAvif: false // Homepage images don't need AVIF
  }
];

const CACHE_FILE = path.join(__dirname, '../.image-cache.json');

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
async function outputFilesExist(dir, baseName, sizes, generateAvif) {
  const checks = [];
  
  for (const width of sizes) {
    const webpPath = path.join(dir, `${baseName}-${width}w.webp`);
    checks.push(fs.access(webpPath).then(() => true).catch(() => false));
    
    if (generateAvif && width >= 800) {
      const avifPath = path.join(dir, `${baseName}-${width}w.avif`);
      checks.push(fs.access(avifPath).then(() => true).catch(() => false));
    }
  }
  
  const results = await Promise.all(checks);
  return results.every(exists => exists);
}

// Process a single image
async function processImage(inputPath, dir, baseName, sizes, generateAvif, skipExisting = true) {
  const results = [];
  
  for (const width of sizes) {
    // Generate WebP
    const webpPath = path.join(dir, `${baseName}-${width}w.webp`);
    
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
    
    // Generate AVIF for larger sizes if enabled
    if (generateAvif && width >= 800) {
      const avifPath = path.join(dir, `${baseName}-${width}w.avif`);
      
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

// Process images in parallel
async function processImagesInParallel(imagesToProcess) {
  const chunks = [];
  const chunkSize = Math.ceil(imagesToProcess.length / MAX_WORKERS);
  
  // Split images into chunks for parallel processing
  for (let i = 0; i < imagesToProcess.length; i += chunkSize) {
    chunks.push(imagesToProcess.slice(i, i + chunkSize));
  }
  
  const promises = chunks.map(async (chunk) => {
    for (const { file, inputPath, dir, baseName, sizes, generateAvif, forceRegenerate } of chunk) {
      try {
        const generated = await processImage(inputPath, dir, baseName, sizes, generateAvif, !forceRegenerate);
        if (generated.length > 0) {
          console.info(`   ✓ Processed ${file} - generated ${generated.length} files`);
        } else if (forceRegenerate) {
          console.info(`   ✓ Processed ${file} - regenerated all formats`);
        } else {
          console.info(`   ✓ Processed ${file} - filled missing formats`);
        }
      } catch (error) {
        console.warn(`   ⚠️ Failed to process ${file}: ${error.message}`);
      }
    }
  });
  
  await Promise.all(promises);
}

// Process a single directory
async function processDirectory(config, cache) {
  const { name, dir, sizes, generateAvif } = config;
  
  try {
    const files = await fs.readdir(dir);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png)$/i.test(file) && !file.includes('-w.')
    );

    console.info(`\n📁 Processing ${name} images:`);
    console.info(`   Found ${imageFiles.length} images in ${dir}`);
    
    const imagesToProcess = [];
    let skippedCount = 0;
    let changedCount = 0;
    
    for (const file of imageFiles) {
      const inputPath = path.join(dir, file);
      const baseName = path.basename(file, path.extname(file));
      const cacheKey = `${name}/${file}`;
      
      // Check if file exists and is accessible
      try {
        const stats = await fs.stat(inputPath);
        // Remove LFS check - we don't use LFS anymore
      } catch (error) {
        console.warn(`   ⚠️ Skipping ${file} - file not accessible`);
        continue;
      }
      
      // Check if image has changed
      const currentHash = await getFileHash(inputPath);
      const cachedHash = cache[cacheKey]?.hash;
      const hasChanged = currentHash !== cachedHash;
      
      // Check if all output files exist
      const allFilesExist = await outputFilesExist(dir, baseName, sizes, generateAvif);
      
      // Always report status for each file
      if (!hasChanged && allFilesExist) {
        console.info(`   ✅ ${file} - CACHE HIT (unchanged and all outputs exist)`);
        skippedCount++;
        continue; // Skip this image completely
      }
      
      if (hasChanged && allFilesExist) {
        changedCount++;
        console.info(`   🔄 ${file} - CACHE MISS (file changed) - will regenerate`);
      } else if (hasChanged && !allFilesExist) {
        changedCount++;
        console.info(`   🔄 ${file} - CACHE MISS (file changed + missing outputs) - will regenerate`);
      } else if (!hasChanged && !allFilesExist) {
        console.info(`   🆕 ${file} - CACHE PARTIAL (unchanged but missing outputs) - will generate missing`);
      }
      
      imagesToProcess.push({
        file,
        inputPath,
        dir,
        baseName,
        sizes,
        generateAvif,
        hash: currentHash,
        cacheKey,
        forceRegenerate: hasChanged
      });
    }
    
    console.info(`   📊 Cache Summary: ${skippedCount} cache hits, ${changedCount} cache misses, ${imagesToProcess.length} total to process`);
    
    return imagesToProcess;
  } catch (error) {
    console.warn(`⚠️ Could not process ${name} directory: ${error.message}`);
    return [];
  }
}

async function generateModernFormats() {
  const startTime = Date.now();
  
  try {
    console.info(`🖼️ Modern Image Format Generator`);
    console.info(`Using ${MAX_WORKERS} parallel workers`);
    
    // Load cache
    const cache = await loadCache();
    
    // Process all configured directories
    const allImagesToProcess = [];
    
    for (const config of IMAGE_CONFIGS) {
      const images = await processDirectory(config, cache);
      allImagesToProcess.push(...images);
    }
    
    if (allImagesToProcess.length === 0) {
      console.info('\n✅ All images are up to date!');
      return;
    }
    
    // Process all images in parallel
    console.info(`\n🚀 Processing ${allImagesToProcess.length} images in parallel...`);
    await processImagesInParallel(allImagesToProcess);
    
    // Update cache with processed images
    for (const { cacheKey, hash } of allImagesToProcess) {
      cache[cacheKey] = { 
        hash, 
        processedAt: new Date().toISOString() 
      };
    }
    await saveCache(cache);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.info(`\n✅ Image processing complete in ${duration}s!`);
    
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