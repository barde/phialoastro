#!/usr/bin/env node
// Favicon generation script for Phialo Design
import sharp from 'sharp';
import toIco from 'to-ico';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceSvg = path.resolve(__dirname, '../src/assets/phialo-logo.svg');
const outputDir = path.resolve(__dirname, '../public');

async function generateFavicons() {
  console.log('🎨 Generating favicons from Phialo logo...');

  try {
    // Ensure source file exists
    await fs.access(sourceSvg);
    
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
    
    // Read the SVG content once to avoid race conditions
    const svgBuffer = await fs.readFile(sourceSvg);
    
    // 1. Write original SVG as favicon.svg (using buffer to avoid race condition)
    await fs.writeFile(path.join(outputDir, 'favicon.svg'), svgBuffer);
    console.log('✅ Created: favicon.svg');

    // 2. Create dark mode variant (for future use if needed)
    // For now, we'll use the same SVG since it has gold and white which work on both backgrounds
    await fs.writeFile(path.join(outputDir, 'favicon-dark.svg'), svgBuffer);
    console.log('✅ Created: favicon-dark.svg');

    // 3. Generate apple-touch-icon.png (180x180)
    await sharp(svgBuffer)
      .resize(180, 180)
      .png({ quality: 95 })
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('✅ Created: apple-touch-icon.png (180x180)');

    // 4. Generate PWA icons for manifest
    const pwaIcons = [
      { size: 192, name: 'icon-192.png' },
      { size: 512, name: 'icon-512.png' }
    ];

    for (const icon of pwaIcons) {
      await sharp(svgBuffer)
        .resize(icon.size, icon.size)
        .png({ quality: 95 })
        .toFile(path.join(outputDir, icon.name));
      console.log(`✅ Created: ${icon.name} (${icon.size}x${icon.size})`);
    }

    // 5. Generate favicon sizes for ICO creation
    const icoSizes = [16, 32, 48];
    const icoBuffers = [];
    
    for (const size of icoSizes) {
      const buffer = await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer();
      
      await fs.writeFile(
        path.join(outputDir, `favicon-${size}.png`),
        buffer
      );
      icoBuffers.push(buffer);
      console.log(`✅ Created: favicon-${size}.png (${size}x${size})`);
    }
    
    // Generate ICO file
    const ico = await toIco(icoBuffers);
    await fs.writeFile(path.join(outputDir, 'favicon.ico'), ico);
    console.log('✅ Created: favicon.ico (16x16, 32x32, 48x48)');

    // 6. Create safari-pinned-tab.svg (monochrome version)
    // Read the SVG content once at the beginning to avoid race conditions
    const svgContentForMonochrome = svgBuffer.toString('utf-8');
    const monochromeContent = svgContentForMonochrome
      .replace(/#d4af37/gi, '#000000') // Replace gold with black
      .replace(/#fff/gi, '#000000')     // Replace white with black
      .replace(/fill:\s*#[a-fA-F0-9]{3,6}/g, 'fill: #000000'); // Replace any fill colors with black
    
    await fs.writeFile(
      path.join(outputDir, 'safari-pinned-tab.svg'),
      monochromeContent
    );
    console.log('✅ Created: safari-pinned-tab.svg (monochrome)');

    // 7. Create site.webmanifest
    const manifest = {
      name: 'Phialo Design - Luxury Jewelry',
      short_name: 'Phialo',
      description: 'Phialo Design - Where jewelry meets innovation. 3D design, individual creations and expertise in jewelry manufacturing.',
      icons: [
        {
          src: '/icon-192.png',
          type: 'image/png',
          sizes: '192x192',
          purpose: 'any maskable'
        },
        {
          src: '/icon-512.png',
          type: 'image/png',
          sizes: '512x512',
          purpose: 'any maskable'
        }
      ],
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      theme_color: '#d4af37',
      background_color: '#ffffff',
      categories: ['lifestyle', 'shopping']
    };

    await fs.writeFile(
      path.join(outputDir, 'site.webmanifest'),
      JSON.stringify(manifest, null, 2)
    );
    console.log('✅ Created: site.webmanifest');

    console.log('\n🎉 Favicon generation complete!');
    console.log('All favicon formats have been generated successfully.');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

// Run the script
generateFavicons().catch(console.error);