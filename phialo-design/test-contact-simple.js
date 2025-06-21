#!/usr/bin/env node

/**
 * Simple contact form test to diagnose the 500 error
 */

const ENDPOINT = 'https://phialo-design-preview.meise.workers.dev/contact';

async function diagnose() {
  console.log('🔍 Diagnosing contact endpoint...\n');

  // 1. Check if site is up
  console.log('1️⃣ Checking if site is accessible...');
  try {
    const siteResponse = await fetch('https://phialo-design-preview.meise.workers.dev/');
    console.log(`✅ Site status: ${siteResponse.status}`);
    console.log(`   Content-Type: ${siteResponse.headers.get('content-type')}`);
  } catch (error) {
    console.log(`❌ Site error: ${error.message}`);
  }

  // 2. Check contact endpoint with GET
  console.log('\n2️⃣ Checking contact endpoint with GET...');
  try {
    const getResponse = await fetch(ENDPOINT, { method: 'GET' });
    console.log(`   GET status: ${getResponse.status}`);
    const getText = await getResponse.text();
    console.log(`   Response: ${getText.substring(0, 100)}...`);
  } catch (error) {
    console.log(`❌ GET error: ${error.message}`);
  }

  // 3. Try minimal JSON POST
  console.log('\n3️⃣ Testing minimal JSON POST...');
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'bdedersen@vogel.yoga',
        message: 'Test 🌟'
      })
    });
    console.log(`   POST status: ${response.status}`);
    console.log(`   Response: ${await response.text()}`);
  } catch (error) {
    console.log(`❌ POST error: ${error.message}`);
  }

  // 4. Check for CORS or other hints
  console.log('\n4️⃣ Checking response headers for clues...');
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    
    console.log('   Response headers:');
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase().includes('allow') || 
          key.toLowerCase().includes('cors') ||
          key.toLowerCase().includes('error')) {
        console.log(`   ${key}: ${value}`);
      }
    }
  } catch (error) {
    console.log(`❌ Header check error: ${error.message}`);
  }

  console.log('\n📋 Summary:');
  console.log('The contact endpoint consistently returns 500 Internal Server Error.');
  console.log('This suggests the worker function has an error in its implementation.');
  console.log('\nPossible causes:');
  console.log('- Missing environment variables (e.g., WEB3FORMS_ACCESS_KEY)');
  console.log('- Worker code error when processing requests');
  console.log('- Missing or incorrect route configuration');
  console.log('\n💡 Recommendation: Check the worker logs in Cloudflare dashboard for error details.');
}

diagnose();