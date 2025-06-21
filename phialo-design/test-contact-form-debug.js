#!/usr/bin/env node

/**
 * Contact Form Debug Test Script
 * Additional tests with different content types and approaches
 */

const ENDPOINT = 'https://phialo-design-preview.meise.workers.dev/contact';
const RECIPIENT_EMAIL = 'bdedersen@vogel.yoga';

// Helper for colored output
const log = (msg, type = 'info') => {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
    reset: '\x1b[0m'
  };
  const color = colors[type] || colors.info;
  console.log(`${color}${msg}${colors.reset}`);
};

// Test 1: Form-encoded data (like a real HTML form)
async function testFormEncoded() {
  log('\n🧪 Test 1: Form-encoded submission', 'info');
  
  const formData = new URLSearchParams();
  formData.append('name', 'Form Test User');
  formData.append('email', RECIPIENT_EMAIL);
  formData.append('phone', '+49 123 456789');
  formData.append('message', 'Testing form-encoded submission with emojis 🌟✨💎🦢');
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '*/*'
      },
      body: formData.toString()
    });
    
    log(`Status: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error');
    const text = await response.text();
    log(`Response: ${text}`);
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// Test 2: Multipart form data
async function testMultipartForm() {
  log('\n🧪 Test 2: Multipart form submission', 'info');
  
  const { FormData } = await import('node-fetch');
  const form = new FormData();
  form.append('name', 'Multipart Test');
  form.append('email', RECIPIENT_EMAIL);
  form.append('message', 'Beautiful jewelry designs! 🎨💍✨');
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      body: form
    });
    
    log(`Status: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error');
    const text = await response.text();
    log(`Response: ${text}`);
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// Test 3: Web3Forms compatible format
async function testWeb3Forms() {
  log('\n🧪 Test 3: Web3Forms API format', 'info');
  
  const data = {
    access_key: 'YOUR_ACCESS_KEY', // This might be required
    name: 'Web3Forms Test',
    email: RECIPIENT_EMAIL,
    message: 'Testing Web3Forms format 🌟',
    subject: 'Contact from Phialo Design',
    from_name: 'Phialo Design Contact Form'
  };
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    log(`Status: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error');
    const text = await response.text();
    log(`Response: ${text}`);
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// Test 4: Check other HTTP methods
async function testHttpMethods() {
  log('\n🧪 Test 4: Testing different HTTP methods', 'info');
  
  const methods = ['GET', 'OPTIONS', 'HEAD'];
  
  for (const method of methods) {
    try {
      const response = await fetch(ENDPOINT, { method });
      log(`${method}: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'warn');
    } catch (error) {
      log(`${method}: ${error.message}`, 'error');
    }
  }
}

// Test 5: Check if it's expecting specific headers
async function testWithHeaders() {
  log('\n🧪 Test 5: Testing with various headers', 'info');
  
  const data = {
    name: 'Header Test',
    email: RECIPIENT_EMAIL,
    message: 'Testing with custom headers 🎨'
  };
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://phialo-design-preview.meise.workers.dev',
        'Referer': 'https://phialo-design-preview.meise.workers.dev/contact',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(data)
    });
    
    log(`Status: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error');
    const text = await response.text();
    log(`Response: ${text}`);
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// Test 6: Try the root endpoint
async function testRootEndpoint() {
  log('\n🧪 Test 6: Testing root endpoint', 'info');
  
  try {
    const response = await fetch('https://phialo-design-preview.meise.workers.dev/', {
      method: 'GET'
    });
    
    log(`Root endpoint status: ${response.status}`, response.ok ? 'success' : 'warn');
    log(`Content-Type: ${response.headers.get('content-type')}`);
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
  }
}

// Main execution
async function runDebugTests() {
  log('🔍 Phialo Design Contact Form Debug Tests', 'info');
  log('=' .repeat(50));
  
  await testFormEncoded();
  await testMultipartForm();
  await testWeb3Forms();
  await testHttpMethods();
  await testWithHeaders();
  await testRootEndpoint();
  
  log('\n✅ Debug tests completed!', 'success');
}

runDebugTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});