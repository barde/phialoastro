#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - Realistic limits for Astro + Alpine.js site
const MAX_TOTAL_SIZE = 800 * 1024;  // 800KB total (with code splitting)
const MAX_INITIAL_SIZE = 250 * 1024; // 250KB initial load per route
const MAX_VENDOR_SIZE = 350 * 1024; // 350KB vendor chunk (Astro + Alpine.js + utilities)
const MAX_ALPINE_SIZE = 100 * 1024; // 100KB for Alpine.js (core + components)
const DIST_DIR = path.join(__dirname, '..', 'dist', '_astro');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

/**
 * Get size of a file in bytes
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Analyze bundle sizes
 */
function analyzeBundles() {
  console.log('\n📊 Bundle Size Analysis\n');
  console.log('=' .repeat(60));

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`${colors.red}Error: Build directory not found. Run 'pnpm build' first.${colors.reset}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DIST_DIR);
  const jsFiles = files.filter(f => f.endsWith('.js'));

  let totalSize = 0;
  let vendorSize = 0;
  let motionSize = 0;
  const bundles = [];

  // Analyze each bundle
  jsFiles.forEach(file => {
    const filePath = path.join(DIST_DIR, file);
    const size = getFileSize(filePath);
    totalSize += size;

    // Categorize bundles
    if (file.includes('vendor') || file.includes('react')) {
      vendorSize += size;
    }
    if (file.includes('motion') || file.includes('framer')) {
      motionSize += size;
    }

    bundles.push({ name: file, size });
  });

  // Sort bundles by size
  bundles.sort((a, b) => b.size - a.size);

  // Display results
  console.log('\n📦 Individual Bundles:\n');
  bundles.slice(0, 10).forEach(bundle => {
    const sizeStr = formatBytes(bundle.size);
    const percentage = ((bundle.size / totalSize) * 100).toFixed(1);
    
    let color = colors.green;
    if (bundle.size > 100 * 1024) color = colors.yellow;
    if (bundle.size > 200 * 1024) color = colors.red;

    // Truncate filename for display
    const displayName = bundle.name.length > 40 
      ? bundle.name.substring(0, 37) + '...' 
      : bundle.name;

    console.log(`  ${color}${displayName.padEnd(40)} ${sizeStr.padStart(10)} (${percentage}%)${colors.reset}`);
  });

  if (bundles.length > 10) {
    console.log(`  ... and ${bundles.length - 10} more files`);
  }

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 Summary:\n');

  // Total bundle size (with code splitting)
  const totalColor = totalSize > MAX_TOTAL_SIZE ? colors.red : colors.green;
  console.log(`  Total JS:     ${totalColor}${formatBytes(totalSize).padStart(10)}${colors.reset} / ${formatBytes(MAX_TOTAL_SIZE)} (with splitting)`);

  // Vendor size
  const vendorColor = vendorSize > MAX_VENDOR_SIZE ? colors.yellow : colors.green;
  console.log(`  Vendor libs:  ${vendorColor}${formatBytes(vendorSize).padStart(10)}${colors.reset} / ${formatBytes(MAX_VENDOR_SIZE)} (target)`);

  // Alpine.js size (replaced motion libraries)
  const alpineSize = bundles.filter(b => b.name.includes('alpine')).reduce((sum, b) => sum + b.size, 0);
  const alpineColor = alpineSize > MAX_ALPINE_SIZE ? colors.yellow : colors.green;
  console.log(`  Alpine.js:    ${alpineColor}${formatBytes(alpineSize).padStart(10)}${colors.reset} / ${formatBytes(MAX_ALPINE_SIZE)} (target)`);

  console.log('\n' + '=' .repeat(60));

  // Check initial load size (critical bundles)
  const initialBundles = bundles.filter(b => 
    b.name.includes('home') || 
    b.name.includes('navigation') || 
    b.name.includes('ClientRouter') ||
    b.name.includes('effects')
  );
  const initialSize = initialBundles.reduce((sum, b) => sum + b.size, 0);
  const initialColor = initialSize > MAX_INITIAL_SIZE ? colors.red : colors.green;
  console.log(`  Initial load: ${initialColor}${formatBytes(initialSize).padStart(10)}${colors.reset} / ${formatBytes(MAX_INITIAL_SIZE)} (target)`);

  console.log('\n' + '=' .repeat(60));

  // Recommendations
  if (totalSize > MAX_TOTAL_SIZE || initialSize > MAX_INITIAL_SIZE || vendorSize > MAX_VENDOR_SIZE) {
    console.log(`\n${colors.yellow}⚠️  Recommendations:${colors.reset}\n`);

    if (totalSize > MAX_TOTAL_SIZE) {
      console.log(`  • Total bundle exceeds ${formatBytes(MAX_TOTAL_SIZE)} limit`);
      console.log(`    Review code splitting strategy`);
    }

    if (initialSize > MAX_INITIAL_SIZE) {
      console.log(`  • Initial load exceeds ${formatBytes(MAX_INITIAL_SIZE)} limit`);
      console.log(`    Defer non-critical features`);
    }

    if (vendorSize > MAX_VENDOR_SIZE) {
      console.log(`  • Vendor bundle is large (${formatBytes(vendorSize)})`);
      console.log(`    Review dependencies and remove unused packages`);
    }

    if (alpineSize > MAX_ALPINE_SIZE) {
      console.log(`  • Alpine.js bundle is large (${formatBytes(alpineSize)})`);
      console.log(`    Consider using Alpine.js CDN or splitting components`);
    }

    // Find largest non-vendor bundles
    const largeBundles = bundles
      .filter(b => !b.name.includes('vendor') && b.size > 50 * 1024)
      .slice(0, 3);

    if (largeBundles.length > 0) {
      console.log(`\n  ${colors.blue}Largest feature bundles to optimize:${colors.reset}`);
      largeBundles.forEach(bundle => {
        const name = bundle.name.replace(/\.[a-zA-Z0-9]+\.js$/, '');
        console.log(`    • ${name}: ${formatBytes(bundle.size)}`);
      });
    }

    console.log('\n' + '=' .repeat(60));
    process.exit(1); // Exit with error if limits exceeded
  } else {
    console.log(`\n${colors.green}✅ All bundle sizes within limits!${colors.reset}\n`);
  }
}

// Run analysis
analyzeBundles();