#!/usr/bin/env node

import { critical } from 'critical';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdir, readFile, writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');

// Pages to extract critical CSS from
const pages = [
  'index.html',
  'en/index.html',
  'portfolio/index.html',
  'en/portfolio/index.html',
  'services/index.html',
  'en/services/index.html',
  'tutorials/index.html',
  'en/tutorials/index.html',
  'about/index.html',
  'en/about/index.html',
  'contact/index.html',
  'en/contact/index.html'
];

// Extract critical CSS for each page
async function extractCriticalCSS() {
  console.log('🎨 Extracting critical CSS...');
  
  const criticalCSSMap = new Map();
  
  for (const page of pages) {
    const pagePath = join(distDir, page);
    
    try {
      console.log(`  📄 Processing ${page}...`);
      
      const result = await critical.generate({
        base: distDir,
        src: page,
        width: 1920,
        height: 1080,
        inline: false,
        extract: false,
        penthouse: {
          blockJSRequests: false,
          renderWaitTime: 100,
          timeout: 30000
        }
      });
      
      // Store the critical CSS for this page type
      const pageType = page.includes('portfolio') ? 'portfolio' :
                      page.includes('services') ? 'services' :
                      page.includes('tutorials') ? 'tutorials' :
                      page.includes('about') ? 'about' :
                      page.includes('contact') ? 'contact' :
                      'home';
      
      if (!criticalCSSMap.has(pageType)) {
        criticalCSSMap.set(pageType, result.css);
      }
      
    } catch (error) {
      console.error(`  ❌ Error processing ${page}:`, error.message);
    }
  }
  
  // Combine all critical CSS
  const combinedCSS = Array.from(criticalCSSMap.values()).join('\n');
  
  // Save combined critical CSS
  const criticalCSSPath = join(__dirname, '../src/shared/layouts/critical-extracted.css');
  await writeFile(criticalCSSPath, combinedCSS);
  
  console.log(`✅ Critical CSS extracted and saved to ${criticalCSSPath}`);
  console.log(`📊 Size: ${(combinedCSS.length / 1024).toFixed(2)} KB`);
  
  return combinedCSS;
}

// Run extraction if called directly
if (process.argv[1] === __filename) {
  extractCriticalCSS().catch(console.error);
}

export { extractCriticalCSS };