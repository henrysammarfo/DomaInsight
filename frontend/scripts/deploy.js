#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'https://domainsight-backend.fly.dev';
const FRONTEND_URL = 'https://domainsight-frontend.vercel.app';

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

// Check if Vercel CLI is installed
function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    logSuccess('Vercel CLI is installed');
    return true;
  } catch (error) {
    logError('Vercel CLI is not installed or not in PATH');
    logInfo('Install it with: npm install -g vercel');
    return false;
  }
}

// Check if user is authenticated with Vercel
function checkVercelAuth() {
  try {
    const result = execSync('vercel whoami', { stdio: 'pipe' });
    const user = result.toString().trim();
    logSuccess(`Authenticated with Vercel as: ${user}`);
    return true;
  } catch (error) {
    logError('Not authenticated with Vercel');
    logInfo('Run: vercel login');
    return false;
  }
}

// Set up environment variables
function setupEnvironment() {
  logStep('1', 'Setting up environment variables...');
  
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  const envPath = path.join(__dirname, '..', '.env');
  
  // Create .env.local with production backend URL
  const envContent = `# Production environment variables
REACT_APP_API_URL=${BACKEND_URL}
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
REACT_APP_BUILD_TIME=${new Date().toISOString()}

# Optional: Add other environment variables here
# REACT_APP_ANALYTICS_ID=your_analytics_id
# REACT_APP_SENTRY_DSN=your_sentry_dsn
`;

  try {
    fs.writeFileSync(envLocalPath, envContent);
    logSuccess('Created .env.local with production configuration');
    logInfo(`Backend URL: ${BACKEND_URL}`);
    
    // Also update .env if it exists
    if (fs.existsSync(envPath)) {
      const existingEnv = fs.readFileSync(envPath, 'utf8');
      if (!existingEnv.includes('REACT_APP_API_URL')) {
        fs.appendFileSync(envPath, `\nREACT_APP_API_URL=${BACKEND_URL}\n`);
        logInfo('Updated .env with production backend URL');
      }
    }
    
  } catch (error) {
    logError(`Failed to create environment file: ${error.message}`);
    throw error;
  }
}

// Build the React application
function buildApp() {
  logStep('2', 'Building React application...');
  
  try {
    logInfo('Running npm run build...');
    
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    return new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          logSuccess('Build completed successfully');
          resolve();
        } else {
          logError(`Build failed with exit code ${code}`);
          reject(new Error(`Build failed with exit code ${code}`));
        }
      });
      
      buildProcess.on('error', (error) => {
        logError(`Build process error: ${error.message}`);
        reject(error);
      });
    });
    
  } catch (error) {
    logError(`Build failed: ${error.message}`);
    throw error;
  }
}

// Deploy to Vercel
function deployToVercel() {
  logStep('3', 'Deploying to Vercel...');
  
  try {
    logInfo('Starting Vercel deployment...');
    
    // Run vercel --prod with real-time output
    const deployProcess = spawn('vercel', ['--prod'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    return new Promise((resolve, reject) => {
      deployProcess.on('close', (code) => {
        if (code === 0) {
          logSuccess('Deployment to Vercel completed successfully');
          resolve();
        } else {
          logError(`Vercel deployment failed with exit code ${code}`);
          reject(new Error(`Vercel deployment failed with exit code ${code}`));
        }
      });
      
      deployProcess.on('error', (error) => {
        logError(`Vercel deployment process error: ${error.message}`);
        reject(error);
      });
    });
    
  } catch (error) {
    logError(`Vercel deployment failed: ${error.message}`);
    throw error;
  }
}

// Get deployment information
function getDeploymentInfo() {
  logStep('4', 'Getting deployment information...');
  
  try {
    const info = execSync('vercel ls', { stdio: 'pipe' });
    logInfo('Recent deployments:');
    console.log(info.toString());
    
    // Try to get project info
    try {
      const projectInfo = execSync('vercel project ls', { stdio: 'pipe' });
      logInfo('Project information:');
      console.log(projectInfo.toString());
    } catch (projectError) {
      logWarning('Could not get project information');
    }
    
  } catch (error) {
    logWarning(`Could not get deployment information: ${error.message}`);
  }
}

// Verify deployment
function verifyDeployment() {
  logStep('5', 'Verifying deployment...');
  
  return new Promise((resolve) => {
    const https = require('https');
    
    const request = https.get(FRONTEND_URL, (response) => {
      if (response.statusCode === 200) {
        logSuccess('Frontend is accessible');
        logInfo(`Status: ${response.statusCode}`);
        logInfo(`URL: ${FRONTEND_URL}`);
        resolve();
      } else {
        logWarning(`Frontend returned status: ${response.statusCode}`);
        resolve();
      }
    });
    
    request.on('error', (error) => {
      logWarning(`Could not verify deployment: ${error.message}`);
      resolve();
    });
    
    request.setTimeout(10000, () => {
      logWarning('Deployment verification timeout');
      request.destroy();
      resolve();
    });
  });
}

// Clean up temporary files
function cleanup() {
  logStep('6', 'Cleaning up...');
  
  try {
    const envLocalPath = path.join(__dirname, '..', '.env.local');
    
    // Optionally remove .env.local after deployment
    // Uncomment the next line if you want to remove it
    // fs.unlinkSync(envLocalPath);
    
    logInfo('Cleanup completed');
    
  } catch (error) {
    logWarning(`Cleanup warning: ${error.message}`);
  }
}

// Check if project is linked to Vercel
function checkVercelProject() {
  try {
    const result = execSync('vercel project ls', { stdio: 'pipe' });
    const output = result.toString();
    
    if (output.includes('domainsight') || output.includes('frontend')) {
      logSuccess('Vercel project is configured');
      return true;
    } else {
      logWarning('No matching Vercel project found');
      logInfo('You may need to link the project: vercel link');
      return false;
    }
  } catch (error) {
    logWarning('Could not check Vercel project status');
    return false;
  }
}

// Main deployment function
async function main() {
  log('🚀 DomaInsight Frontend Deployment Script', 'bright');
  log('======================================', 'bright');
  
  try {
    // Pre-deployment checks
    if (!checkVercelCLI()) {
      process.exit(1);
    }
    
    if (!checkVercelAuth()) {
      process.exit(1);
    }
    
    checkVercelProject();
    
    // Setup and deploy
    setupEnvironment();
    await buildApp();
    await deployToVercel();
    
    // Post-deployment
    getDeploymentInfo();
    await verifyDeployment();
    cleanup();
    
    log('\n🎉 Frontend deployment completed successfully!', 'green');
    log(`🌐 Frontend URL: ${FRONTEND_URL}`, 'cyan');
    log(`🔗 Backend URL: ${BACKEND_URL}`, 'cyan');
    log('\n📋 Next steps:', 'yellow');
    log('1. Test the deployed frontend', 'blue');
    log('2. Verify API connectivity', 'blue');
    log('3. Check CORS configuration', 'blue');
    log('4. Monitor performance and errors', 'blue');
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    log('\n🔧 Troubleshooting:', 'yellow');
    log('1. Check Vercel authentication: vercel whoami', 'blue');
    log('2. Verify project linking: vercel project ls', 'blue');
    log('3. Check build logs for errors', 'blue');
    log('4. Ensure all dependencies are installed', 'blue');
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
  deployToVercel,
  buildApp,
  setupEnvironment,
  checkVercelCLI,
  checkVercelAuth
};
