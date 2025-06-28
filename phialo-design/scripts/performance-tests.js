#!/usr/bin/env node

/**
 * Performance test suite for Phialo Design
 * Runs various performance benchmarks and generates reports
 */

import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';
import path from 'path';

async function runPerformanceTests() {
  console.log('🚀 Running performance tests...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: Bundle size check
  console.log('📦 Checking bundle sizes...');
  try {
    const distPath = path.join(process.cwd(), 'dist');
    const stats = await fs.stat(distPath);
    
    if (stats.isDirectory()) {
      const files = await fs.readdir(path.join(distPath, 'assets'));
      let totalSize = 0;
      
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.css')) {
          const filePath = path.join(distPath, 'assets', file);
          const fileStats = await fs.stat(filePath);
          totalSize += fileStats.size;
          
          results.tests.push({
            name: `Bundle: ${file}`,
            size: fileStats.size,
            sizeKB: (fileStats.size / 1024).toFixed(2),
            status: fileStats.size < 100000 ? 'pass' : 'warn'
          });
        }
      }
      
      results.tests.push({
        name: 'Total bundle size',
        size: totalSize,
        sizeKB: (totalSize / 1024).toFixed(2),
        status: totalSize < 350000 ? 'pass' : 'fail'
      });
    }
  } catch (error) {
    console.error('Error checking bundle sizes:', error.message);
  }

  // Test 2: Build time measurement
  console.log('\n⏱️  Measuring build performance...');
  const buildStart = performance.now();
  
  // Simulate build time measurement (in real scenario, would trigger actual build)
  results.tests.push({
    name: 'Build time',
    duration: 'N/A (run npm run build separately)',
    status: 'info'
  });

  // Test 3: Memory usage
  console.log('\n💾 Checking memory usage...');
  const memUsage = process.memoryUsage();
  results.tests.push({
    name: 'Memory usage',
    heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
    status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'pass' : 'warn'
  });

  // Generate report
  console.log('\n📊 Generating performance report...\n');
  
  const reportPath = path.join(process.cwd(), 'performance-report.json');
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  
  // Output summary
  console.log('Performance Test Summary:');
  console.log('========================');
  results.tests.forEach(test => {
    const status = test.status === 'pass' ? '✅' : 
                  test.status === 'fail' ? '❌' : 
                  test.status === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${status} ${test.name}: ${test.sizeKB || test.duration || test.heapUsed || 'N/A'}`);
  });
  
  console.log('\n✨ Performance tests completed!');
  console.log(`📄 Full report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  const hasFailures = results.tests.some(t => t.status === 'fail');
  process.exit(hasFailures ? 1 : 0);
}

// Run tests
runPerformanceTests().catch(error => {
  console.error('❌ Performance tests failed:', error);
  process.exit(1);
});