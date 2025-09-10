#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const BACKEND_URL = 'https://domainsight-backend.fly.dev';
const HEALTH_ENDPOINT = `${BACKEND_URL}/health`;
const APP_NAME = 'domainsight-backend';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if flyctl is installed
function checkFlyctl() {
  try {
    execSync('flyctl version', { stdio: 'pipe' });
    logSuccess('Fly CLI is installed');
    return true;
  } catch (error) {
    logError('Fly CLI is not installed or not in PATH');
    logInfo('Install it from: https://fly.io/docs/hands-on/install-flyctl/');
    return false;
  }
}

// Check if user is authenticated with Fly.io
function checkAuth() {
  try {
    const result = execSync('flyctl auth whoami', { stdio: 'pipe' });
    const user = result.toString().trim();
    logSuccess(`Authenticated as: ${user}`);
    return true;
  } catch (error) {
    logError('Not authenticated with Fly.io');
    logInfo('Run: flyctl auth login');
    return false;
  }
}

// Validate environment variables
function validateEnvVars() {
  logStep('1', 'Validating environment variables...');
  
  const envFile = path.join(__dirname, '..', '.env');
  const envExampleFile = path.join(__dirname, '..', 'env.example');
  
  // Check if .env file exists
  if (!fs.existsSync(envFile)) {
    if (fs.existsSync(envExampleFile)) {
      logWarning('.env file not found, but env.example exists');
      logInfo('Copy env.example to .env and fill in your values');
    } else {
      logWarning('.env file not found');
    }
  }
  
  // Check for required environment variables in Fly.io secrets
  try {
    const secrets = execSync('flyctl secrets list', { stdio: 'pipe' });
    const secretsOutput = secrets.toString();
    
    if (secretsOutput.includes('PRIVATE_KEY')) {
      logSuccess('PRIVATE_KEY is set in Fly.io secrets');
    } else {
      logWarning('PRIVATE_KEY not found in Fly.io secrets');
      logInfo('Set it with: flyctl secrets set PRIVATE_KEY="your_key_here"');
    }
    
    if (secretsOutput.includes('NODE_ENV')) {
      logSuccess('NODE_ENV is set in Fly.io secrets');
    } else {
      logInfo('NODE_ENV not set (will use default)');
    }
    
  } catch (error) {
    logWarning('Could not check Fly.io secrets (app might not exist yet)');
  }
  
  return true;
}

// Check if app exists
function checkAppExists() {
  try {
    execSync(`flyctl apps list | grep ${APP_NAME}`, { stdio: 'pipe' });
    logSuccess(`App ${APP_NAME} exists`);
    return true;
  } catch (error) {
    logWarning(`App ${APP_NAME} does not exist`);
    logInfo(`Create it with: flyctl apps create ${APP_NAME}`);
    return false;
  }
}

// Deploy to Fly.io
function deployToFly() {
  logStep('2', 'Deploying to Fly.io...');
  
  try {
    logInfo('Starting deployment...');
    
    // Run flyctl deploy with real-time output
    const deployProcess = spawn('flyctl', ['deploy'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    return new Promise((resolve, reject) => {
      deployProcess.on('close', (code) => {
        if (code === 0) {
          logSuccess('Deployment completed successfully');
          resolve();
        } else {
          logError(`Deployment failed with exit code ${code}`);
          reject(new Error(`Deployment failed with exit code ${code}`));
        }
      });
      
      deployProcess.on('error', (error) => {
        logError(`Deployment process error: ${error.message}`);
        reject(error);
      });
    });
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    throw error;
  }
}

// Check health endpoint
function checkHealth() {
  logStep('3', 'Checking health endpoint...');
  
  return new Promise((resolve, reject) => {
    const request = https.get(HEALTH_ENDPOINT, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const healthData = JSON.parse(data);
          
          if (response.statusCode === 200 && healthData.status === 'ok') {
            logSuccess('Health check passed');
            logInfo(`Status: ${healthData.status}`);
            logInfo(`Model: ${healthData.model}`);
            logInfo(`Multi-chain: ${healthData.multiChain}`);
            logInfo(`Supported chains: ${healthData.supportedChains?.join(', ')}`);
            logInfo(`Wallet: ${healthData.wallet || 'Not configured'}`);
            logInfo(`On-chain actions: ${healthData.onChainActions ? 'Enabled' : 'Disabled'}`);
            resolve(healthData);
          } else {
            logError(`Health check failed: ${healthData.status || 'Unknown status'}`);
            reject(new Error(`Health check failed: ${healthData.status || 'Unknown status'}`));
          }
        } catch (parseError) {
          logError(`Failed to parse health response: ${parseError.message}`);
          logInfo(`Raw response: ${data}`);
          reject(parseError);
        }
      });
    });
    
    request.on('error', (error) => {
      logError(`Health check request failed: ${error.message}`);
      reject(error);
    });
    
    request.setTimeout(30000, () => {
      logError('Health check timeout (30s)');
      request.destroy();
      reject(new Error('Health check timeout'));
    });
  });
}

// Get deployment status
function getDeploymentStatus() {
  logStep('4', 'Getting deployment status...');
  
  try {
    const status = execSync('flyctl status', { stdio: 'pipe' });
    logInfo('Deployment status:');
    console.log(status.toString());
    
    const info = execSync('flyctl info', { stdio: 'pipe' });
    logInfo('App information:');
    console.log(info.toString());
    
  } catch (error) {
    logWarning(`Could not get deployment status: ${error.message}`);
  }
}

// Main deployment function
async function main() {
  log('🚀 DomaInsight Backend Deployment Script', 'bright');
  log('=====================================', 'bright');
  
  try {
    // Pre-deployment checks
    if (!checkFlyctl()) {
      process.exit(1);
    }
    
    if (!checkAuth()) {
      process.exit(1);
    }
    
    validateEnvVars();
    checkAppExists();
    
    // Deploy
    await deployToFly();
    
    // Post-deployment checks
    await checkHealth();
    getDeploymentStatus();
    
    log('\n🎉 Deployment completed successfully!', 'green');
    log(`🌐 Backend URL: ${BACKEND_URL}`, 'cyan');
    log(`🏥 Health Check: ${HEALTH_ENDPOINT}`, 'cyan');
    log('\n📋 Next steps:', 'yellow');
    log('1. Update frontend REACT_APP_API_URL to point to this backend', 'blue');
    log('2. Test all API endpoints', 'blue');
    log('3. Monitor logs with: flyctl logs', 'blue');
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    log('\n🔧 Troubleshooting:', 'yellow');
    log('1. Check Fly.io authentication: flyctl auth whoami', 'blue');
    log('2. Verify app exists: flyctl apps list', 'blue');
    log('3. Check secrets: flyctl secrets list', 'blue');
    log('4. View logs: flyctl logs', 'blue');
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the deployment
if (require.main === module) {
  main();
}

module.exports = {
  deployToFly,
  checkHealth,
  validateEnvVars,
  checkFlyctl,
  checkAuth
};
