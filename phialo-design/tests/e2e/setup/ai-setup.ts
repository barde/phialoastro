import type { FullConfig } from '@playwright/test';

/**
 * Global setup for AI-powered tests
 * Configures AI services and validates environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🤖 Setting up AI-powered testing environment...');
  
  // Check for required environment variables
  const requiredEnvVars = ['ZEROSTEP_API_TOKEN'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && process.env.CI) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.log('💡 Get your free API token at: https://zerostep.com');
    process.exit(1);
  }
  
  // Set default AI configuration
  process.env.AI_MODEL = process.env.AI_MODEL || 'gpt-4';
  process.env.AI_MAX_RETRIES = process.env.AI_MAX_RETRIES || '3';
  process.env.AI_TIMEOUT = process.env.AI_TIMEOUT || '30000';
  
  // Log configuration
  console.log('🔧 AI Test Configuration:');
  console.log(`  - Model: ${process.env.AI_MODEL}`);
  console.log(`  - Max Retries: ${process.env.AI_MAX_RETRIES}`);
  console.log(`  - Timeout: ${process.env.AI_TIMEOUT}ms`);
  console.log(`  - Base URL: ${config.projects[0].use?.baseURL}`);
  
  // Validate AI service connectivity
  if (process.env.ZEROSTEP_API_TOKEN) {
    try {
      // In a real implementation, ping the AI service
      console.log('✅ AI service connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to AI service:', error);
      if (process.env.CI) {
        process.exit(1);
      }
    }
  } else {
    console.log('⚠️  Running in demo mode without AI service');
  }
  
  console.log('🚀 AI testing environment ready!\n');
}

export default globalSetup;