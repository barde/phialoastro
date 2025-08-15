#!/usr/bin/env node

/**
 * Build-time asset pre-compression script
 * Generates .br (Brotli) and .gz (Gzip) versions of static assets
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';
import { brotliCompressSync, gzipSync, constants } from 'zlib';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  // Directory to scan for assets
  distDir: join(__dirname, '..', 'dist'),
  
  // File extensions to compress
  compressibleExtensions: [
    '.html',
    '.css',
    '.js',
    '.mjs',
    '.json',
    '.xml',
    '.svg',
    '.txt',
    '.webmanifest'
  ],
  
  // Minimum file size to compress (in bytes)
  minSize: 1024, // 1KB
  
  // Maximum file size to compress (in bytes)
  maxSize: 10 * 1024 * 1024, // 10MB
  
  // Compression levels
  brotliLevel: constants.BROTLI_MAX_QUALITY,
  gzipLevel: constants.Z_BEST_COMPRESSION,
  
  // Skip patterns (files/folders to ignore)
  skipPatterns: [
    /node_modules/,
    /\.br$/,
    /\.gz$/
  ]
};

// Statistics tracking
const stats = {
  filesProcessed: 0,
  filesCompressed: 0,
  totalOriginalSize: 0,
  totalBrotliSize: 0,
  totalGzipSize: 0,
  errors: []
};

/**
 * Check if a file should be compressed
 */
function shouldCompress(filePath, stats) {
  // Check skip patterns
  if (CONFIG.skipPatterns.some(pattern => pattern.test(filePath))) {
    return false;
  }
  
  // Check file extension
  const ext = extname(filePath).toLowerCase();
  if (!CONFIG.compressibleExtensions.includes(ext)) {
    return false;
  }
  
  // Check file size
  const size = stats.size;
  if (size < CONFIG.minSize || size > CONFIG.maxSize) {
    return false;
  }
  
  // Check if already compressed versions exist and are newer
  try {
    const brPath = filePath + '.br';
    const gzPath = filePath + '.gz';
    const fileMtime = stats.mtime;
    
    const brStats = statSync(brPath);
    const gzStats = statSync(gzPath);
    
    // If both compressed versions exist and are newer, skip
    if (brStats.mtime >= fileMtime && gzStats.mtime >= fileMtime) {
      return false;
    }
  } catch (e) {
    // Compressed files don't exist, should compress
  }
  
  return true;
}

/**
 * Compress a single file
 */
function compressFile(filePath) {
  try {
    // Read original file
    const originalData = readFileSync(filePath);
    const originalSize = originalData.length;
    
    stats.totalOriginalSize += originalSize;
    
    // Brotli compression
    const brotliData = brotliCompressSync(originalData, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: CONFIG.brotliLevel
      }
    });
    const brotliSize = brotliData.length;
    const brotliRatio = ((1 - brotliSize / originalSize) * 100).toFixed(2);
    
    // Only save if compression is beneficial
    if (brotliSize < originalSize) {
      writeFileSync(filePath + '.br', brotliData);
      stats.totalBrotliSize += brotliSize;
    } else {
      stats.totalBrotliSize += originalSize;
    }
    
    // Gzip compression
    const gzipData = gzipSync(originalData, {
      level: CONFIG.gzipLevel
    });
    const gzipSize = gzipData.length;
    const gzipRatio = ((1 - gzipSize / originalSize) * 100).toFixed(2);
    
    // Only save if compression is beneficial
    if (gzipSize < originalSize) {
      writeFileSync(filePath + '.gz', gzipData);
      stats.totalGzipSize += gzipSize;
    } else {
      stats.totalGzipSize += originalSize;
    }
    
    stats.filesCompressed++;
    
    const fileName = basename(filePath);
    console.log(
      `✓ ${fileName}: ${formatSize(originalSize)} → ` +
      `Brotli: ${formatSize(brotliSize)} (${brotliRatio}%), ` +
      `Gzip: ${formatSize(gzipSize)} (${gzipRatio}%)`
    );
    
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`✗ Error compressing ${filePath}: ${error.message}`);
  }
}

/**
 * Recursively scan directory and compress files
 */
function scanDirectory(dirPath) {
  try {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const entryStats = statSync(fullPath);
      
      if (entryStats.isDirectory()) {
        // Skip certain directories
        if (!CONFIG.skipPatterns.some(pattern => pattern.test(fullPath))) {
          scanDirectory(fullPath);
        }
      } else if (entryStats.isFile()) {
        stats.filesProcessed++;
        
        if (shouldCompress(fullPath, entryStats)) {
          compressFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Format file size for display
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Print compression statistics
 */
function printStats() {
  console.log('\n' + '='.repeat(60));
  console.log('Compression Statistics');
  console.log('='.repeat(60));
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files compressed: ${stats.filesCompressed}`);
  console.log(`\nOriginal size: ${formatSize(stats.totalOriginalSize)}`);
  console.log(`Brotli size: ${formatSize(stats.totalBrotliSize)} (${((1 - stats.totalBrotliSize / stats.totalOriginalSize) * 100).toFixed(2)}% reduction)`);
  console.log(`Gzip size: ${formatSize(stats.totalGzipSize)} (${((1 - stats.totalGzipSize / stats.totalOriginalSize) * 100).toFixed(2)}% reduction)`);
  
  if (stats.errors.length > 0) {
    console.log(`\nErrors encountered: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }
  
  console.log('='.repeat(60));
}

/**
 * Main execution
 */
function main() {
  console.log('Starting asset compression...');
  console.log(`Scanning directory: ${CONFIG.distDir}`);
  console.log(`Compressing extensions: ${CONFIG.compressibleExtensions.join(', ')}`);
  console.log('');
  
  // Check if dist directory exists
  try {
    statSync(CONFIG.distDir);
  } catch (error) {
    console.error(`Error: dist directory not found at ${CONFIG.distDir}`);
    console.error('Please run the build command first.');
    process.exit(1);
  }
  
  // Start compression
  const startTime = Date.now();
  scanDirectory(CONFIG.distDir);
  const endTime = Date.now();
  
  // Print statistics
  printStats();
  console.log(`\nCompression completed in ${((endTime - startTime) / 1000).toFixed(2)}s`);
  
  // Exit with error code if there were errors
  if (stats.errors.length > 0) {
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { compressFile, scanDirectory, CONFIG };