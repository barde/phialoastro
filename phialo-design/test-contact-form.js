#!/usr/bin/env node

/**
 * Contact Form Test Script
 * Tests submission to https://phialo-design-preview.meise.workers.dev/contact
 * 
 * This script tests both successful submissions and error cases
 */

// Test configuration
const ENDPOINT = 'https://phialo-design-preview.meise.workers.dev/contact';
const RECIPIENT_EMAIL = 'bdedersen@vogel.yoga';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test cases
const testCases = [
  {
    name: 'Successful submission with emojis',
    data: {
      name: 'Test User',
      email: RECIPIENT_EMAIL,
      phone: '+49 1234 567890',
      message: `Hello! 🌟✨ I'm interested in creating a custom jewelry piece. 
      
I love the artistic approach shown in your portfolio! 🎨💎 

The swan designs are particularly beautiful 🦢

Looking forward to discussing my ideas with you!

Best regards,
Test User ✨`
    },
    expectedStatus: [200, 201, 204]
  },
  {
    name: 'Submission with minimal data',
    data: {
      name: 'Minimal Test',
      email: RECIPIENT_EMAIL,
      message: 'Simple test message 💎'
    },
    expectedStatus: [200, 201, 204]
  },
  {
    name: 'Submission with special characters',
    data: {
      name: 'Müller-Schmidt',
      email: RECIPIENT_EMAIL,
      phone: '+49 (0) 30 / 12345678',
      message: 'Testing special chars: äöüß & "quotes" <tags> 🌟'
    },
    expectedStatus: [200, 201, 204]
  },
  {
    name: 'Invalid email format',
    data: {
      name: 'Invalid Email Test',
      email: 'not-an-email',
      message: 'This should fail validation'
    },
    expectedStatus: [400, 422]
  },
  {
    name: 'Missing required fields',
    data: {
      name: 'Missing Fields Test'
      // Missing email and message
    },
    expectedStatus: [400, 422]
  },
  {
    name: 'Empty submission',
    data: {},
    expectedStatus: [400, 422]
  }
];

// Function to perform a single test
async function runTest(testCase) {
  log(`\n📧 Running test: ${testCase.name}`, 'cyan');
  log('Request data:', 'bright');
  console.log(JSON.stringify(testCase.data, null, 2));

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'PhialoDesign-ContactForm-Test/1.0'
      },
      body: JSON.stringify(testCase.data)
    });

    const statusOk = testCase.expectedStatus.includes(response.status);
    const statusSymbol = statusOk ? '✅' : '❌';
    const statusColor = statusOk ? 'green' : 'red';
    
    log(`${statusSymbol} Status: ${response.status} ${response.statusText}`, statusColor);
    log(`Headers:`, 'bright');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    let responseBody;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    log('Response body:', 'bright');
    if (typeof responseBody === 'string') {
      console.log(responseBody);
    } else {
      console.log(JSON.stringify(responseBody, null, 2));
    }

    if (statusOk) {
      log(`✨ Test PASSED: Expected status ${testCase.expectedStatus.join(' or ')}`, 'green');
    } else {
      log(`⚠️  Test FAILED: Expected status ${testCase.expectedStatus.join(' or ')}, got ${response.status}`, 'red');
    }

    return { success: statusOk, status: response.status, response: responseBody };

  } catch (error) {
    log(`❌ Test FAILED with error: ${error.message}`, 'red');
    log('Error details:', 'yellow');
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Function to test if the endpoint is reachable
async function checkEndpoint() {
  log('🔍 Checking if endpoint is reachable...', 'blue');
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'OPTIONS',
      headers: {
        'User-Agent': 'PhialoDesign-ContactForm-Test/1.0'
      }
    });
    
    if (response.ok || response.status === 405) { // 405 means OPTIONS not allowed but endpoint exists
      log('✅ Endpoint is reachable', 'green');
      return true;
    } else {
      log(`⚠️  Endpoint returned status ${response.status}`, 'yellow');
      return true; // Still try to run tests
    }
  } catch (error) {
    log(`❌ Cannot reach endpoint: ${error.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Phialo Design Contact Form Test Suite', 'bright');
  log(`📍 Testing endpoint: ${ENDPOINT}`, 'blue');
  log(`📧 Recipient email: ${RECIPIENT_EMAIL}`, 'blue');
  log('═'.repeat(60), 'bright');

  // Check if endpoint is reachable
  const isReachable = await checkEndpoint();
  if (!isReachable) {
    log('\n⚠️  Endpoint is not reachable. Tests may fail.', 'yellow');
  }

  // Run all tests
  const results = [];
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push({ name: testCase.name, ...result });
    
    // Add a small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  log('\n' + '═'.repeat(60), 'bright');
  log('📊 Test Summary:', 'bright');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  
  if (failed > 0) {
    log('\nFailed tests:', 'red');
    results.filter(r => !r.success).forEach(r => {
      log(`  - ${r.name}`, 'red');
    });
  }

  log('\n✨ Test suite completed!', 'cyan');
}

// Run the tests
runAllTests().catch(error => {
  log('💥 Fatal error running tests:', 'red');
  console.error(error);
  process.exit(1);
});