// Astro integration to optimize script loading
export default function optimizeScripts() {
  return {
    name: 'optimize-scripts',
    hooks: {
      'astro:build:done': async ({ dir, pages }) => {
        const { readFile, writeFile } = await import('fs/promises');
        const { join } = await import('path');
        const { glob } = await import('glob');
        
        // Find all HTML files in the build output
        const htmlFiles = await glob('**/*.html', {
          cwd: dir.pathname,
          absolute: true,
        });
        
        for (const file of htmlFiles) {
          let html = await readFile(file, 'utf-8');
          
          // Add defer to non-critical scripts
          html = html.replace(
            /<script(?![^>]*\s(?:defer|async|type="module"|is:inline))/g,
            '<script defer'
          );
          
          // Make analytics scripts async
          html = html.replace(
            /<script([^>]*cloudflareinsights[^>]*)>/g,
            '<script$1 async>'
          );
          
          // Add loading="lazy" to images not in viewport
          html = html.replace(
            /<img(?![^>]*\s(?:loading|fetchpriority="high"))/g,
            '<img loading="lazy"'
          );
          
          // Add decoding="async" to images
          html = html.replace(
            /<img(?![^>]*\sdecoding=)/g,
            '<img decoding="async"'
          );
          
          await writeFile(file, html);
        }
        
        console.log(`✅ Optimized scripts and images in ${htmlFiles.length} HTML files`);
      },
    },
  };
}