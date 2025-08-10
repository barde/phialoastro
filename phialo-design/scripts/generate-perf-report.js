#!/usr/bin/env node

/**
 * Generate human-readable performance report from test results
 */

import { promises as fs } from 'fs';
import path from 'path';

async function generateReport() {
  try {
    // Read performance test results
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    const data = await fs.readFile(reportPath, 'utf-8');
    const results = JSON.parse(data);
    
    // Generate markdown report
    let report = `# Performance Report\n\n`;
    report += `**Generated**: ${new Date(results.timestamp).toLocaleString()}\n\n`;
    
    report += `## Summary\n\n`;
    
    // Bundle sizes
    const bundleTests = results.tests.filter(t => t.name.includes('Bundle'));
    if (bundleTests.length > 0) {
      report += `### Bundle Sizes\n\n`;
      report += `| File | Size | Status |\n`;
      report += `|------|------|--------|\n`;
      
      bundleTests.forEach(test => {
        const status = test.status === 'pass' ? '✅ Pass' : 
                      test.status === 'fail' ? '❌ Fail' : 
                      '⚠️ Warning';
        report += `| ${test.name} | ${test.sizeKB} KB | ${status} |\n`;
      });
      report += `\n`;
    }
    
    // Memory usage
    const memTest = results.tests.find(t => t.name === 'Memory usage');
    if (memTest) {
      report += `### Memory Usage\n\n`;
      report += `- **Heap Used**: ${memTest.heapUsed}\n`;
      report += `- **Heap Total**: ${memTest.heapTotal}\n`;
      report += `- **RSS**: ${memTest.rss}\n`;
      report += `- **Status**: ${memTest.status === 'pass' ? '✅ Pass' : '⚠️ Warning'}\n\n`;
    }
    
    // Recommendations
    report += `## Recommendations\n\n`;
    
    const totalBundleTest = results.tests.find(t => t.name === 'Total bundle size');
    if (totalBundleTest && totalBundleTest.status !== 'pass') {
      report += `- ⚠️ **Bundle size exceeds recommended limit** (${totalBundleTest.sizeKB} KB > 350 KB)\n`;
      report += `  - Consider code splitting for large components\n`;
      report += `  - Review and remove unused dependencies\n`;
      report += `  - Enable tree shaking and minification\n\n`;
    }
    
    if (memTest && memTest.status !== 'pass') {
      report += `- ⚠️ **High memory usage detected**\n`;
      report += `  - Review for memory leaks\n`;
      report += `  - Optimize data structures\n`;
      report += `  - Consider lazy loading strategies\n\n`;
    }
    
    // Output the report
    console.warn(report);
    
  } catch (error) {
    console.error('Error generating report:', error.message);
    console.warn('# Performance Report\n\nNo performance data available. Run `npm run test:performance` first.\n');
  }
}

// Generate report
generateReport();