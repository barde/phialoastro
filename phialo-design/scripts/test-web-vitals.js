#!/usr/bin/env node

/**
 * Test script to verify Web Vitals monitoring is working
 * Run this after starting the preview server
 */

import puppeteer from 'puppeteer';

const TEST_URL = process.env.TEST_URL || 'http://localhost:4325';

async function testWebVitals() {
  console.log('🧪 Testing Web Vitals Monitoring...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console messages
    const vitalsCollected = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Web Vitals]')) {
        vitalsCollected.push(text);
        console.log('✅', text);
      }
    });
    
    // Listen for network requests to vitals endpoint
    page.on('request', request => {
      if (request.url().includes('/api/vitals')) {
        console.log('📊 Metrics sent to:', request.url());
        console.log('   Method:', request.method());
        console.log('   Post Data:', request.postData());
      }
    });
    
    console.log(`📍 Navigating to ${TEST_URL}...`);
    await page.goto(TEST_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for Web Vitals to be collected
    console.log('\n⏳ Waiting for Web Vitals collection...');
    await page.waitForTimeout(3000);
    
    // Interact with the page to trigger INP
    console.log('\n👆 Triggering interactions for INP...');
    await page.click('body');
    await page.waitForTimeout(1000);
    
    // Scroll to trigger CLS if any
    console.log('📜 Scrolling to check CLS...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Check if vitals were collected
    console.log('\n📈 Summary:');
    if (vitalsCollected.length > 0) {
      console.log(`   ✅ Collected ${vitalsCollected.length} Web Vitals metrics`);
    } else {
      console.log('   ⚠️  No Web Vitals collected (this might be normal in dev mode)');
    }
    
    // Check for the WebVitalsMonitor component
    const hasMonitor = await page.evaluate(() => {
      return !!document.querySelector('script[type="module"]')?.textContent?.includes('web-vitals');
    });
    
    if (hasMonitor) {
      console.log('   ✅ WebVitalsMonitor component is loaded');
    } else {
      console.log('   ❌ WebVitalsMonitor component not found');
    }
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        ttfb: navigation.responseStart - navigation.requestStart,
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        domComplete: navigation.domComplete - navigation.fetchStart
      };
    });
    
    console.log('\n⚡ Performance Metrics:');
    console.log(`   TTFB: ${metrics.ttfb.toFixed(2)}ms`);
    console.log(`   FCP: ${metrics.fcp?.toFixed(2)}ms`);
    console.log(`   DOM Complete: ${metrics.domComplete.toFixed(2)}ms`);
    
    console.log('\n✅ Web Vitals monitoring test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the test
testWebVitals().catch(console.error);